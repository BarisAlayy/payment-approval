const axios = require("axios");

const NETGSM_CONFIG = {
  usercode: process.env.NETGSM_USERCODE,
  password: process.env.NETGSM_PASSWORD,
  msgheader: process.env.NETGSM_MSGHEADER,
  bossPhones: process.env.NETGSM_BOSS_PHONES,
};

const formatAmount = (amount) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const turkishToEnglish = (text) =>
  text
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C");

const sendSMSToBoss = async (amount, paymentType) => {
  if (process.env.SMS_ENABLED !== "true") {
    return true;
  }

  const { usercode, password, msgheader, bossPhones } = NETGSM_CONFIG;
  if (!usercode || !password || !msgheader || !bossPhones) {
    return false;
  }

  const formattedAmount = formatAmount(amount);
  const safePaymentType = turkishToEnglish(paymentType);
  const message = `Onayinizi bekleyen yeni bir odeme talebi var, \n\nTutar: ${formattedAmount} TL - \n\nOdeme Turu: ${safePaymentType}`;

  const noTags = bossPhones
    .split(",")
    .map((num) => `<no>${num.trim()}</no>`)
    .join("\n");

  const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
    <mainbody>
      <header>
        <company dil="TR">Netgsm</company>
        <usercode>${usercode}</usercode>
        <password>${password}</password>
        <type>1:n</type>
        <msgheader>${msgheader}</msgheader>
      </header>
      <body>
        <msg><![CDATA[${message}]]></msg>
        ${noTags}
      </body>
    </mainbody>`;

  try {
    const response = await axios.post("https://api.netgsm.com.tr/sms/send/xml", xmlData, {
      headers: { "Content-Type": "application/xml", Accept: "application/xml" },
      timeout: 10000,
    });
    const data = response.data;
    return typeof data === "string" && data.includes("00");
  } catch {
    return false;
  }
};

module.exports = { sendSMSToBoss };

require("dotenv").config();
const mongoose = require("mongoose");
const PaymentType = require("../models/paymentTypeModel");
const User = require("../models/userModel");
const connectDB = require("../config/db");

const defaultPaymentTypes = [
  { name: "Malzeme Ödemesi", description: "Proje malzemeleri için yapılan ödemeler" },
  { name: "İşçilik Ödemesi", description: "Proje işçilik ödemeleri" },
  { name: "Kira Ödemesi", description: "Ofis, depo vb. kira ödemeleri" },
  { name: "Fatura Ödemesi", description: "Elektrik, su, doğalgaz vb. fatura ödemeleri" },
  { name: "Vergi Ödemesi", description: "KDV, stopaj vb. vergi ödemeleri" },
  { name: "SGK Ödemesi", description: "Personel SGK ödemeleri" },
  { name: "Avans Ödemesi", description: "Personel avans ödemeleri" },
  { name: "Diğer", description: "Diğer ödemeler" },
];

const run = async () => {
  try {
    await connectDB();

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("Admin kullanıcısı bulunamadı. Önce admin kullanıcısı oluşturun.");
    }

    let created = 0;
    for (const type of defaultPaymentTypes) {
      const existing = await PaymentType.findOne({
        name: { $regex: new RegExp(`^${type.name}$`, "i") },
      });
      if (existing) continue;
      await PaymentType.create({
        name: type.name,
        description: type.description,
        createdBy: admin._id,
        updatedBy: admin._id,
      });
      created += 1;
    }

    process.stdout.write(`${created} ödeme türü oluşturuldu. Tamamlandı.\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Hata: ${err.message}\n`);
    process.exit(1);
  }
};

run();

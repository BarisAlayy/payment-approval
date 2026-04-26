const mongoose = require("mongoose");

const brandingSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "branding", unique: true },
    companyName: { type: String, default: "Şirket Adı" },
    siteTitle: { type: String, default: "Ödeme Onay Sistemi" },
    headerTitle: { type: String, default: "Ödeme Onay Sistemi" },
    loginSubtitle: {
      type: String,
      default: "Lütfen giriş yapmak için bilgilerinizi giriniz",
    },
    footerText: { type: String, default: "© Tüm hakları saklıdır." },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branding", brandingSchema);

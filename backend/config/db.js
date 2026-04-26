const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI bulunamadı. Lütfen .env dosyasını kontrol edin.");
  }

  mongoose.set("strictQuery", false);

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  return conn;
};

module.exports = connectDB;

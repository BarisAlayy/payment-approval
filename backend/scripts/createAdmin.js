require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const connectDB = require("../config/db");

const adminCredentials = {
  username: "admin",
  email: "admin@example.com",
  password: "admin123",
  role: "admin",
};

const run = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({
      $or: [{ username: adminCredentials.username }, { email: adminCredentials.email }],
    });

    if (existing) {
      process.stdout.write("Admin kullanıcısı zaten mevcut.\n");
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);
    await User.create({
      username: adminCredentials.username,
      email: adminCredentials.email,
      password: hashedPassword,
      role: adminCredentials.role,
    });

    process.stdout.write(
      `Admin oluşturuldu.\nKullanıcı adı: ${adminCredentials.username}\nŞifre: ${adminCredentials.password}\n`
    );
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    process.stderr.write(`Hata: ${err.message}\n`);
    process.exit(1);
  }
};

run();

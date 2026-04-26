const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

const uploadDir = path.join(__dirname, "../uploads");
const invoicesDir = path.join(uploadDir, "invoices");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, invoicesDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError("Geçersiz dosya türü. PDF, JPEG veya PNG yükleyin.", 400, "INVALID_FILE_TYPE"), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

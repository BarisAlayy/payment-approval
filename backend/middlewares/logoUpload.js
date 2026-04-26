const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

const brandingDir = path.join(__dirname, "../uploads/branding");
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, brandingDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, "logo-" + Date.now() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/x-icon"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError("Geçersiz dosya türü. PNG, JPEG, SVG, WebP veya ICO yükleyin.", 400, "INVALID_FILE_TYPE_BRANDING"), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

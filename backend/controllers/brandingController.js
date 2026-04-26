const path = require("path");
const fs = require("fs");
const Branding = require("../models/brandingModel");
const AppError = require("../utils/AppError");

const SINGLETON = { singleton: "branding" };

const getOrCreate = async () => {
  let doc = await Branding.findOne(SINGLETON);
  if (!doc) doc = await Branding.create(SINGLETON);
  return doc;
};

const removeLocalFile = (relativeUrl) => {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/branding/")) return;
  const filePath = path.join(__dirname, "..", relativeUrl);
  fs.unlink(filePath, () => {});
};

exports.getBranding = async (req, res, next) => {
  try {
    const doc = await getOrCreate();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.updateBranding = async (req, res, next) => {
  try {
    const allowed = ["companyName", "siteTitle", "headerTitle", "loginSubtitle", "footerText"];
    const update = {};
    for (const key of allowed) {
      if (typeof req.body[key] !== "string") continue;
      const value = req.body[key].trim();
      if (value.length > 200) {
        throw new AppError(
          `${key} en fazla 200 karakter olabilir.`,
          400,
          "BRANDING_FIELD_TOO_LONG",
          { field: key }
        );
      }
      update[key] = value;
    }
    const doc = await Branding.findOneAndUpdate(
      SINGLETON,
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

const handleImageUpload = (field) => async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Dosya bulunamadı", 400, "BRANDING_FILE_NOT_FOUND");
    }
    const prev = await Branding.findOne(SINGLETON);
    const newUrl = `/uploads/branding/${req.file.filename}`;
    const doc = await Branding.findOneAndUpdate(
      SINGLETON,
      { $set: { [field]: newUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (prev) removeLocalFile(prev[field]);
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.uploadLogo = handleImageUpload("logoUrl");
exports.uploadFavicon = handleImageUpload("faviconUrl");

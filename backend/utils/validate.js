const AppError = require("./AppError");

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const requireFields = (body, fields) => {
  const missing = fields.filter((f) => !isNonEmptyString(body[f]));
  if (missing.length) {
    throw new AppError(
      `Zorunlu alanlar eksik: ${missing.join(", ")}`,
      400,
      "VALIDATION_REQUIRED",
      { fields: missing.join(", ") }
    );
  }
};

const assertLength = (value, field, min, max, fieldCode = null) => {
  const len = (value || "").length;
  if (len < min) {
    throw new AppError(
      `${field} en az ${min} karakter olmalı`,
      400,
      "VALIDATION_MIN_LENGTH",
      { field, min, fieldCode }
    );
  }
  if (max && len > max) {
    throw new AppError(
      `${field} en fazla ${max} karakter olabilir`,
      400,
      "VALIDATION_MAX_LENGTH",
      { field, max, fieldCode }
    );
  }
};

const assertEmail = (value, field = "E-posta", fieldCode = "EMAIL") => {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  if (!ok) {
    throw new AppError(
      `${field} geçerli biçimde değil`,
      400,
      "VALIDATION_EMAIL",
      { field, fieldCode }
    );
  }
};

const assertOneOf = (value, field, options, fieldCode = null) => {
  if (!options.includes(value)) {
    throw new AppError(
      `${field} şu değerlerden biri olmalı: ${options.join(", ")}`,
      400,
      "VALIDATION_ONE_OF",
      { field, options: options.join(", "), fieldCode }
    );
  }
};

module.exports = { isNonEmptyString, requireFields, assertLength, assertEmail, assertOneOf };

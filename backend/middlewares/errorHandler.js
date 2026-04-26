const { pickLang, translate, translateField } = require("../utils/messages");

const notFound = (req, res) => {
  const lang = pickLang(req.headers["accept-language"]);
  const params = { method: req.method, url: req.originalUrl };
  res.status(404).json({
    errorCode: "NOT_FOUND",
    params,
    message: translate(lang, "NOT_FOUND", params),
  });
};

const errorHandler = (err, req, res, _next) => {
  const lang = pickLang(req.headers["accept-language"]);
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || null;
  let params = err.params || null;
  let message = err.message || translate(lang, "SERVER_ERROR");

  if (params && params.fieldCode) {
    params = { ...params, field: translateField(lang, params.fieldCode) };
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = translate(lang, errorCode);
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "alan";
    errorCode = "DUPLICATE_FIELD";
    params = { field };
    message = translate(lang, errorCode, params);
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "TOKEN_INVALID";
    message = translate(lang, errorCode);
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    message = translate(lang, errorCode);
  } else if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      errorCode = "FILE_SIZE_LIMIT";
      message = translate(lang, errorCode);
    } else {
      errorCode = "FILE_UPLOAD_ERROR";
      params = { details: err.message };
      message = translate(lang, errorCode, params);
    }
  } else if (errorCode) {
    message = translate(lang, errorCode, params);
  } else if (statusCode >= 500) {
    errorCode = "SERVER_ERROR";
    message = translate(lang, errorCode);
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload = { message };
  if (errorCode) payload.errorCode = errorCode;
  if (params) payload.params = params;

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };

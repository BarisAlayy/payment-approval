const { pickLang, translate } = require("./messages");

const respond = (req, res, status, code, data = {}, params = null) => {
  const lang = pickLang(req.headers["accept-language"]);
  const message = translate(lang, code, params);
  const payload = { errorCode: code, message, ...data };
  if (params) payload.params = params;
  return res.status(status).json(payload);
};

module.exports = { respond };

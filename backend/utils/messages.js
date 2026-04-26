const en = require("./locales/en.json");
const tr = require("./locales/tr.json");

const DICTS = { en, tr };
const DEFAULT_LANG = "en";

const pickLang = (header) => {
  if (!header) return DEFAULT_LANG;
  const short = String(header).toLowerCase().split(",")[0].trim().split("-")[0];
  return DICTS[short] ? short : DEFAULT_LANG;
};

const interpolate = (template, params) => {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : ""
  );
};

const translate = (lang, code, params) => {
  const dict = DICTS[lang] || DICTS[DEFAULT_LANG];
  const template = dict[code];
  if (!template) return code;
  return interpolate(template, params);
};

const translateField = (lang, fieldCode) => {
  if (!fieldCode) return "";
  const dict = DICTS[lang] || DICTS[DEFAULT_LANG];
  return dict[`VALIDATION_FIELD_${fieldCode}`] || fieldCode;
};

module.exports = { pickLang, translate, translateField };

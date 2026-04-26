import i18n from "../i18n";

export const translateError = (error, fallbackKey) => {
  const data = error?.response?.data;
  if (data?.errorCode) {
    const key = `serverErrors.${data.errorCode}`;
    const translated = i18n.t(key, { ...(data.params || {}), defaultValue: "" });
    if (translated) return translated;
  }
  if (data?.message) return data.message;
  if (fallbackKey) return i18n.t(fallbackKey);
  return i18n.t("common.unknownError");
};

export const translateServer = (payload, fallbackKey) => {
  if (payload?.errorCode) {
    const translated = i18n.t(`serverErrors.${payload.errorCode}`, { ...(payload.params || {}), defaultValue: "" });
    if (translated) return translated;
  }
  if (payload?.message) return payload.message;
  if (fallbackKey) return i18n.t(fallbackKey);
  return "";
};

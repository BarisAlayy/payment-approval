import axios from "axios";
import i18n from "../i18n";
import { notify } from "../context/NotificationContext";
import { translateServer } from "./i18nError";

const instance = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const initialToken = localStorage.getItem("token");
if (initialToken) {
  instance.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Accept-Language"] = i18n.language || "en";
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      translateServer(error.response?.data) ||
      (error.code === "ECONNABORTED" ? i18n.t("common.requestTimeout") : null) ||
      error.message ||
      i18n.t("common.unknownError");

    if (status === 401) {
      localStorage.removeItem("token");
      delete instance.defaults.headers.common["Authorization"];
      if (window.location.pathname !== "/") {
        notify(i18n.t("common.sessionExpired"), "warning");
        window.location.href = "/";
      }
    } else if (status >= 500) {
      notify(message, "error");
    } else if (status === 403) {
      notify(message, "warning");
    }

    return Promise.reject(error);
  }
);

export default instance;

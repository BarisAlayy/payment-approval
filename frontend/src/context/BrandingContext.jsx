import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "../utils/axios";
import { translateServer } from "../utils/i18nError";

const buildDefaults = (t) => ({
  companyName: t("defaultBranding.companyName"),
  siteTitle: t("defaultBranding.siteTitle"),
  headerTitle: t("defaultBranding.headerTitle"),
  loginSubtitle: t("defaultBranding.loginSubtitle"),
  footerText: t("defaultBranding.footerText"),
  logoUrl: "",
  faviconUrl: "",
});

const BrandingContext = createContext(null);

const applyFavicon = (url) => {
  if (!url) return;
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
};

export const BrandingProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const DEFAULTS = useMemo(() => buildDefaults(t), [t, i18n.language]);
  const [raw, setRaw] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const branding = useMemo(() => ({ ...DEFAULTS, ...raw }), [DEFAULTS, raw]);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await axios.get("/branding");
      setRaw(res.data || {});
      setError(null);
    } catch (err) {
      setError(translateServer(err?.response?.data, "branding.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    if (branding.siteTitle) document.title = branding.siteTitle;
  }, [branding.siteTitle]);

  useEffect(() => {
    applyFavicon(branding.faviconUrl);
  }, [branding.faviconUrl]);

  const updateText = async (payload) => {
    const res = await axios.put("/branding", payload);
    setRaw(res.data || {});
    return res.data;
  };

  const uploadImage = (endpoint, field) => async (file) => {
    const form = new FormData();
    form.append(field, file);
    const res = await axios.post(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setRaw(res.data || {});
    return res.data;
  };

  const value = {
    branding,
    loading,
    error,
    refresh: fetchBranding,
    updateText,
    uploadLogo: uploadImage("/branding/logo", "logo"),
    uploadFavicon: uploadImage("/branding/favicon", "favicon"),
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
};

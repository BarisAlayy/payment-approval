import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useTranslation } from "react-i18next";
import { useBranding } from "../context/BrandingContext";
import { useNotify } from "../context/NotificationContext";
import { translateError } from "../utils/i18nError";

const MAX_UPLOAD_MB = 10;
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon";

const ImageCard = ({ title, helper, currentUrl, uploading, onUpload, buttonLabel }) => {
  const { t } = useTranslation();
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {helper}
        </Typography>

        <Stack direction="row" spacing={3} alignItems="center">
          <Box
            sx={{
              width: 120,
              height: 120,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.default",
              overflow: "hidden",
            }}
          >
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("branding.noImage", { title })}
              </Typography>
            )}
          </Box>

          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
          >
            {uploading ? t("common.uploading") : buttonLabel}
            <input hidden type="file" accept={ACCEPTED_IMAGE_TYPES} onChange={onUpload} />
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const Branding = () => {
  const { t } = useTranslation();
  const { branding, loading, updateText, uploadLogo, uploadFavicon, refresh } = useBranding();
  const notify = useNotify();

  const [form, setForm] = useState({
    companyName: "",
    siteTitle: "",
    headerTitle: "",
    loginSubtitle: "",
    footerText: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    setForm({
      companyName: branding.companyName || "",
      siteTitle: branding.siteTitle || "",
      headerTitle: branding.headerTitle || "",
      loginSubtitle: branding.loginSubtitle || "",
      footerText: branding.footerText || "",
    });
  }, [branding]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateText(form);
      notify.success(t("branding.savedSuccess"));
    } catch (err) {
      notify.error(translateError(err, "branding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const createUploadHandler = (uploader, setUploading, successMessage) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      notify.error(t("branding.maxFileSize", { max: MAX_UPLOAD_MB }));
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      await uploader(file);
      notify.success(successMessage);
    } catch (err) {
      notify.error(translateError(err, "branding.uploadError"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t("branding.title")}
      </Typography>

      <ImageCard
        title={t("branding.logo")}
        helper={t("branding.logoHelper", { max: MAX_UPLOAD_MB })}
        currentUrl={branding.logoUrl}
        uploading={uploadingLogo}
        buttonLabel={t("branding.uploadLogo")}
        onUpload={createUploadHandler(uploadLogo, setUploadingLogo, t("branding.logoUpdated"))}
      />

      <ImageCard
        title={t("branding.favicon")}
        helper={t("branding.faviconHelper", { max: MAX_UPLOAD_MB })}
        currentUrl={branding.faviconUrl}
        uploading={uploadingFavicon}
        buttonLabel={t("branding.uploadFavicon")}
        onUpload={createUploadHandler(uploadFavicon, setUploadingFavicon, t("branding.faviconUpdated"))}
      />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t("branding.texts")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              name="companyName"
              label={t("branding.companyName")}
              value={form.companyName}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 200 }}
              helperText={t("branding.companyNameHelper")}
            />
            <TextField
              name="siteTitle"
              label={t("branding.siteTitle")}
              value={form.siteTitle}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 200 }}
              helperText={t("branding.siteTitleHelper")}
            />
            <TextField
              name="headerTitle"
              label={t("branding.headerTitle")}
              value={form.headerTitle}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              name="loginSubtitle"
              label={t("branding.loginSubtitle")}
              value={form.loginSubtitle}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              name="footerText"
              label={t("branding.footerText")}
              value={form.footerText}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 200 }}
              helperText={t("branding.footerTextHelper")}
            />
          </Stack>

          <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={refresh} disabled={saving}>
              {t("branding.resetButton")}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("branding.saveButton")}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Branding;

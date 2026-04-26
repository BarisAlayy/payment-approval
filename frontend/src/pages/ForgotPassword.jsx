import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useBranding } from "../context/BrandingContext";
import { useNotify } from "../context/NotificationContext";
import { translateError, translateServer } from "../utils/i18nError";

const ForgotPassword = () => {
  const { branding } = useBranding();
  const notify = useNotify();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(t("forgotPassword.identifierRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/users/forgot-password", {
        identifier: identifier.trim(),
      });
      notify.success(translateServer(response.data) || t("forgotPassword.title"));
      setIdentifier("");
    } catch (err) {
      notify.error(translateError(err, "forgotPassword.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        py: 3,
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              style={{ height: 80, width: "auto", marginBottom: "1rem" }}
            />
          )}
          <Typography variant="h5" component="h1" gutterBottom>
            {t("forgotPassword.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {t("forgotPassword.description")}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t("forgotPassword.identifierLabel")}
            variant="outlined"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting} sx={{ mb: 2 }}>
            {submitting ? t("common.sending") : t("forgotPassword.submitButton")}
          </Button>
          <Box sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/" variant="body2" sx={{ textDecoration: "none" }}>
              {t("forgotPassword.backToLogin")}
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;

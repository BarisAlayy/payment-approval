import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useBranding } from "../context/BrandingContext";
import { useNotify } from "../context/NotificationContext";
import { translateError, translateServer } from "../utils/i18nError";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&.])[A-Za-z\d@$!%*#?&.]{8,}$/;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const { branding } = useBranding();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axiosInstance.get(`/users/reset-password/${token}`);
        setTokenValid(true);
      } catch (err) {
        notify.error(translateError(err, "resetPassword.invalidOrExpired"));
        setTimeout(() => navigate("/"), 2000);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, navigate, notify]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = t("changePassword.validation.newRequired");
    else if (!PASSWORD_REGEX.test(formData.password))
      newErrors.password = t("changePassword.validation.newFormat");

    if (!formData.confirmPassword) newErrors.confirmPassword = t("changePassword.validation.confirmRequired");
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t("changePassword.validation.mismatch");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await axiosInstance.post(`/users/reset-password/${token}`, {
        password: formData.password,
      });
      notify.success(translateServer(response.data) || t("resetPassword.title"));
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      notify.error(translateError(err, "resetPassword.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tokenValid) return null;

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
            <img src={branding.logoUrl} alt={branding.companyName} style={{ height: 80, marginBottom: "1rem" }} />
          )}
          <Typography variant="h5" component="h1" gutterBottom>
            {t("resetPassword.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {t("resetPassword.description")}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label={t("resetPassword.newPassword")}
            name="password"
            type={showPasswords.password ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || t("changePassword.passwordHelper")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility("password")} edge="end">
                    {showPasswords.password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("resetPassword.confirmNewPassword")}
            name="confirmPassword"
            type={showPasswords.confirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility("confirmPassword")} edge="end">
                    {showPasswords.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting} sx={{ mt: 3 }}>
            {submitting ? t("common.saving") : t("resetPassword.submitButton")}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ResetPassword;

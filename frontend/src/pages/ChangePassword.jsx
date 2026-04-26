import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axios";
import { useNotify } from "../context/NotificationContext";
import { translateError, translateServer } from "../utils/i18nError";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&.])[A-Za-z\d@$!%*#?&.]{8,}$/;

const initialForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

const ChangePassword = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialForm);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    if (!formData.currentPassword) newErrors.currentPassword = t("changePassword.validation.currentRequired");

    if (!formData.newPassword) newErrors.newPassword = t("changePassword.validation.newRequired");
    else if (!PASSWORD_REGEX.test(formData.newPassword))
      newErrors.newPassword = t("changePassword.validation.newFormat");

    if (!formData.confirmPassword) newErrors.confirmPassword = t("changePassword.validation.confirmRequired");
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = t("changePassword.validation.mismatch");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/users/change-password", formData);
      notify.success(translateServer(response.data) || t("changePassword.title"));
      setFormData(initialForm);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      notify.error(translateError(err, "changePassword.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "currentPassword", label: t("changePassword.currentPassword"), helperText: null },
    {
      name: "newPassword",
      label: t("changePassword.newPassword"),
      helperText: t("changePassword.passwordHelper"),
    },
    { name: "confirmPassword", label: t("changePassword.confirmPassword"), helperText: null },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 3 }}
      >
        {t("common.back")}
      </Button>

      <Paper sx={{ maxWidth: 600, mx: "auto", p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t("changePassword.title")}
        </Typography>

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <TextField
              key={field.name}
              fullWidth
              margin="normal"
              label={field.label}
              name={field.name}
              type={showPasswords[field.name] ? "text" : "password"}
              value={formData[field.name]}
              onChange={handleChange}
              error={!!errors[field.name]}
              helperText={errors[field.name] || field.helperText}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility(field.name)} edge="end">
                      {showPasswords[field.name] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ))}

          <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting} sx={{ mt: 3 }}>
            {submitting ? t("common.saving") : t("changePassword.submit")}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ChangePassword;

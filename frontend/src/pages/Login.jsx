import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { branding } = useBranding();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch {
      setError(t("common.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3, textAlign: "center" }}>
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  style={{ height: 100, marginBottom: 16 }}
                />
              )}
              <Typography variant="h5" component="h1" gutterBottom>
                {branding.companyName}
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {branding.headerTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {branding.loginSubtitle}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                name="username"
                label={t("login.username")}
                value={formData.username}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ minLength: 3, maxLength: 50 }}
              />
              <TextField
                name="password"
                label={t("login.password")}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ textDecoration: "none" }}>
                  {t("login.forgotPassword")}
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t("login.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;

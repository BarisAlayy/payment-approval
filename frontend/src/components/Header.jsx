import React from "react";
import { AppBar, Toolbar, Box, Typography, IconButton, Avatar } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { branding } = useBranding();

  return (
    <AppBar position="static" sx={{ backgroundColor: "#90815f" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          <Box sx={{ backgroundColor: "#000", display: "flex", alignItems: "center", height: 80, px: 1 }}>
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt={branding.companyName} style={{ height: "70px" }} />
            )}
          </Box>
          <Typography variant="h6" sx={{ ml: 2, color: "#fff" }}>
            {branding.headerTitle}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle1" sx={{ color: "inherit" }}>
            {user?.username}
          </Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={logout} sx={{ "&:hover": { color: "error.light" } }}>
            <ExitToAppIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

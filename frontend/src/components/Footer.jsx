import React from "react";
import { Box, Typography } from "@mui/material";
import { useBranding } from "../context/BrandingContext";

const Footer = () => {
  const { branding } = useBranding();
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#313131",
        color: "#fff",
        textAlign: "center",
        py: 2,
        mt: "auto",
      }}
    >
      <Typography variant="body2">{branding.footerText}</Typography>
    </Box>
  );
};

export default Footer;

import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import i18n from "../i18n";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            bgcolor: "background.default",
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {i18n.t("errorBoundary.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {i18n.t("errorBoundary.description")}
            </Typography>
            <Button variant="contained" onClick={this.handleReset}>
              {i18n.t("errorBoundary.goHome")}
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

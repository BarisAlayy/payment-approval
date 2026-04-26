import React from "react";
import { Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PaymentEntry from "./pages/PaymentEntry";
import ApproveReject from "./pages/ApproveReject";
import ApprovedPayments from "./pages/ApprovedPayments";
import CompletedPayments from "./pages/CompletedPayments";
import AdminPanel from "./pages/AdminPanel";
import Layout from "./components/Layout";
import PaymentTypes from "./pages/PaymentTypes";
import RejectedPayments from "./pages/RejectedPayments";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Branding from "./pages/Branding";

import ProtectedRoute from "./routes/ProtectedRoute";
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#004d8d",
      light: "#3373a6",
      dark: "#003666",
      lighter: "#e6f0f7",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5c6b7a",
      light: "#8e99a4",
      dark: "#3a4651",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#ed6c02",
      light: "#ff9800",
      dark: "#b54708",
      lighter: "#fff4e5",
      contrastText: "#ffffff",
    },
    success: {
      main: "#2e7d32",
      light: "#4caf50",
      dark: "#1b5e20",
      lighter: "#e8f5e9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#0288d1",
      light: "#03a9f4",
      dark: "#01579b",
      lighter: "#e1f5fe",
      contrastText: "#ffffff",
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
      dark: "#c62828",
      lighter: "#ffebee",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f8fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#666666",
    },
    divider: "rgba(0, 77, 141, 0.08)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: "2.5rem",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.125rem",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "0.875rem",
      letterSpacing: "0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      letterSpacing: "0.02em",
    },
    caption: {
      fontSize: "0.75rem",
      letterSpacing: "0.03em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "8px 20px",
          borderRadius: 8,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 8px rgba(45, 40, 33, 0.12)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 6px rgba(45, 40, 33, 0.06)",
          borderRadius: 16,
          border: "1px solid rgba(45, 40, 33, 0.05)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          "&:last-child": {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(45, 40, 33, 0.08)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/paymententry"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <PaymentEntry />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvereject"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <ApproveReject />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvedpayments"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <ApprovedPayments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rejectedpayments"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <RejectedPayments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/completedpayments"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <CompletedPayments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-types"
          element={
            <ProtectedRoute
              rolesAllowed={["boss", "finance", "purchaser", "admin"]}
            >
              <Layout>
                <PaymentTypes />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute rolesAllowed={["admin"]}>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branding"
          element={
            <ProtectedRoute rolesAllowed={["admin"]}>
              <Layout>
                <Branding />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute rolesAllowed={["boss", "finance", "purchaser", "admin"]}>
              <Layout>
                <ChangePassword />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

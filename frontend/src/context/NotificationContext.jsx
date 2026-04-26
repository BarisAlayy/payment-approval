import React, { createContext, useCallback, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext(null);

let externalNotify = null;

export const notify = (message, severity = "info") => {
  if (externalNotify) externalNotify(message, severity);
};

export const NotificationProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, message: "", severity: "info" });

  const show = useCallback((message, severity = "info") => {
    setState({ open: true, message, severity });
  }, []);

  const api = {
    show,
    success: useCallback((m) => show(m, "success"), [show]),
    info: useCallback((m) => show(m, "info"), [show]),
    warning: useCallback((m) => show(m, "warning"), [show]),
    error: useCallback((m) => show(m, "error"), [show]),
  };

  externalNotify = show;

  const handleClose = (_event, reason) => {
    if (reason === "clickaway") return;
    setState((prev) => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be used within NotificationProvider");
  return ctx;
};

"use client";

import { Snackbar, Alert, AlertColor } from "@mui/material";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LinearProgress } from "@mui/material";
interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");

  const showToast = useCallback((msg: string, sev: AlertColor = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string) => {
    showToast(msg, "success");
  }, [showToast]);

  const showError = useCallback((msg: string) => {
    showToast(msg, "error");
  }, [showToast]);

  const showWarning = useCallback((msg: string) => {
    showToast(msg, "warning");
  }, [showToast]);

  const showInfo = useCallback((msg: string) => {
    showToast(msg, "info");
  }, [showToast]);
  

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        className=""
      >
        <Alert 
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: "100%",
            fontFamily: "Cairo, sans-serif",
            fontSize: "0.875rem",
            boxShadow: 3,
          }}
        >
          <div className="mx-4">
          {message}
          </div>
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

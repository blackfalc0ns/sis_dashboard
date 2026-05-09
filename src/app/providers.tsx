"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
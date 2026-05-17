"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/theme";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { CommunicationRealtimeProvider } from "@/features/communication/realtime/CommunicationRealtimeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CommunicationRealtimeProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CommunicationRealtimeProvider>
    </AuthProvider>
  );
}

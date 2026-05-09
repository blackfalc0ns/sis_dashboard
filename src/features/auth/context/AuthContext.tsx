// FILE: src/features/auth/context/AuthContext.tsx
import { createContext } from "react";
import type { LoginRequest, MeResponse } from "@/types/user";

export interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

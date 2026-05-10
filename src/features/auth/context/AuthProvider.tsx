// FILE: src/features/auth/context/AuthProvider.tsx
"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "./AuthContext";
import { authService } from "@/services/auth-service";
import { tokenStorage } from "@/lib/token-storage";
import type { LoginRequest, MeResponse } from "@/types/user";
import { isApiError } from "@/lib/api-error";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const getLocalizedPath = useCallback(
    (destination: "login" | "dashboard") => {
      const match = pathname.match(/^\/([a-z]{2})/);
      const locale = match ? match[1] : "en";
      return `/${locale}/${destination}`;
    },
    [pathname],
  );

  const loadUser = useCallback(async () => {
    try {
      if (tokenStorage.hasTokens()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      setUser(null);
      if (!tokenStorage.hasTokens()) {
        return;
      }

      if (!isApiError(error) || error.status === 401) {
        tokenStorage.clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      try {
        await authService.login(credentials);
        await loadUser();
      } finally {
        setIsLoading(false);
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      router.push(getLocalizedPath("login"));
    } finally {
      setIsLoading(false);
    }
  }, [getLocalizedPath, router]);

  // Client-side route protection
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname.includes("/login");
      const isRootRoute = pathname === "/" || pathname === "/ar" || pathname === "/en";

      if (!user && !isAuthRoute && !isRootRoute) {
        router.push(getLocalizedPath("login"));
      } else if (user && isAuthRoute) {
        router.push(getLocalizedPath("dashboard"));
      }
    }
  }, [user, isLoading, pathname, router, getLocalizedPath]);


  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

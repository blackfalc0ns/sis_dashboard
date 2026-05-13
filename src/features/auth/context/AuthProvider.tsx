// FILE: src/features/auth/context/AuthProvider.tsx
"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "./AuthContext";
import { authService } from "@/services/auth-service";
import { tokenStorage } from "@/lib/token-storage";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  MeResponse,
} from "@/types/user";
import { isApiError } from "@/lib/api-error";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const getLocalizedPath = useCallback(
    (destination: "login" | "dashboard" | "change-password") => {
      const match = pathname.match(/^\/([a-z]{2})/);
      const locale = match ? match[1] : "en";
      return `/${locale}/${destination}`;
    },
    [pathname],
  );

  const loadUser = useCallback(async (fallbackMustChangePassword?: boolean) => {
    try {
      if (tokenStorage.hasTokens()) {
        const currentUser = await authService.getCurrentUser();
        const normalizedUser: MeResponse = {
          ...currentUser,
          mustChangePassword:
            currentUser.mustChangePassword ?? fallbackMustChangePassword,
        };
        setUser(normalizedUser);
        return normalizedUser;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      setUser(null);
      if (!tokenStorage.hasTokens()) {
        return null;
      }

      if (!isApiError(error) || error.status === 401) {
        tokenStorage.clearTokens();
      }
      return null;
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
        const loginResponse = await authService.login(credentials);
        return await loadUser(loginResponse.user.mustChangePassword);
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

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true);
    return loadUser();
  }, [loadUser]);

  const changePassword = useCallback(
    async (
      payload: ChangePasswordRequest,
    ): Promise<ChangePasswordResponse> => {
      return authService.changePassword(payload);
    },
    [],
  );

  const mustChangePassword = Boolean(user?.mustChangePassword);

  // Client-side route protection
  useEffect(() => {
    if (!isLoading) {
      const loginPath = getLocalizedPath("login");
      const dashboardPath = getLocalizedPath("dashboard");
      const changePasswordPath = getLocalizedPath("change-password");
      const isLoginRoute = pathname === loginPath;
      const isChangePasswordRoute = pathname === changePasswordPath;
      const isRootRoute = pathname === "/" || pathname === "/ar" || pathname === "/en";

      if (!user && !isLoginRoute && !isRootRoute) {
        router.push(loginPath);
        return;
      }

      if (!user) {
        return;
      }

      if (mustChangePassword && !isChangePasswordRoute) {
        router.push(changePasswordPath);
        return;
      }

      if (!mustChangePassword && (isLoginRoute || isChangePasswordRoute)) {
        router.push(dashboardPath);
      }
    }
  }, [
    user,
    isLoading,
    pathname,
    router,
    getLocalizedPath,
    mustChangePassword,
  ]);


  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      mustChangePassword,
      login,
      logout,
      refreshCurrentUser,
      changePassword,
    }),
    [
      user,
      isLoading,
      mustChangePassword,
      login,
      logout,
      refreshCurrentUser,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

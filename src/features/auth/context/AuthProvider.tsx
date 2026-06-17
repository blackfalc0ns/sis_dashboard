// FILE: src/features/auth/context/AuthProvider.tsx
"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthContext } from "./AuthContext";
import { authService } from "@/services/auth-service";
import { tokenStorage } from "@/lib/token-storage";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  MeResponse,
} from "@/types/user";
import { isApiError } from "@/lib/api-error";
import {
  localeFromPathname,
  safeAuthReturnPath,
} from "@/features/auth/utils/authRedirect";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = localeFromPathname(pathname);

  const getLocalizedPath = useCallback(
    (destination: "login" | "dashboard" | "change-password") => {
      return `/${currentLocale}/${destination}`;
    },
    [currentLocale],
  );

  const loginPathWithRedirect = useCallback(() => {
    const loginPath = getLocalizedPath("login");
    const isLoginRoute = pathname === loginPath;
    const isRootRoute = pathname === "/" || pathname === "/ar" || pathname === "/en";
    const queryString = searchParams.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    if (isLoginRoute || isRootRoute) {
      return loginPath;
    }

    return `${loginPath}?next=${encodeURIComponent(currentPath)}`;
  }, [getLocalizedPath, pathname, searchParams]);

  const loginReturnPath = useCallback(() => {
    return safeAuthReturnPath(
      searchParams.get("next") ?? searchParams.get("redirect"),
      currentLocale,
    );
  }, [currentLocale, searchParams]);

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

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsLoading(false);
      router.push(loginPathWithRedirect());
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [loginPathWithRedirect, router]);

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
        router.push(loginPathWithRedirect());
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
        router.push(isLoginRoute ? loginReturnPath() ?? dashboardPath : dashboardPath);
      }
    }
  }, [
    user,
    isLoading,
    pathname,
    router,
    getLocalizedPath,
    loginPathWithRedirect,
    loginReturnPath,
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

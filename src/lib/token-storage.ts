// FILE: src/lib/token-storage.ts

const ACCESS_TOKEN_KEY = "moazez_access_token";
const REFRESH_TOKEN_KEY = "moazez_refresh_token";

export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

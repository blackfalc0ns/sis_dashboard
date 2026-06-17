import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

const authProviderMocks = vi.hoisted(() => ({
  pathname: "/ar/login",
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  getCurrentUser: vi.fn(),
  hasTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: authProviderMocks.push }),
  usePathname: () => authProviderMocks.pathname,
  useSearchParams: () => authProviderMocks.searchParams,
}));

vi.mock("@/services/auth-service", () => ({
  authService: {
    getCurrentUser: authProviderMocks.getCurrentUser,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    hasTokens: authProviderMocks.hasTokens,
    clearTokens: authProviderMocks.clearTokens,
    getRefreshToken: vi.fn(),
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
  },
}));

describe("AuthProvider route redirects", () => {
  beforeEach(() => {
    authProviderMocks.pathname = "/ar/login";
    authProviderMocks.searchParams = new URLSearchParams();
    authProviderMocks.push.mockReset();
    authProviderMocks.getCurrentUser.mockReset();
    authProviderMocks.hasTokens.mockReset();
    authProviderMocks.clearTokens.mockReset();
  });

  it("returns an authenticated user from login to the safe next path", async () => {
    authProviderMocks.searchParams = new URLSearchParams({
      next: "/ar/dashboard/recent-activities",
    });
    authProviderMocks.hasTokens.mockReturnValue(true);
    authProviderMocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      mustChangePassword: false,
    });

    render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authProviderMocks.push).toHaveBeenCalledWith(
        "/ar/dashboard/recent-activities",
      );
    });
  });
});

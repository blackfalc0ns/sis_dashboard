import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppDownloadGate } from "../AppDownloadGate";

const authMocks = vi.hoisted(() => ({
  auth: { isLoading: false, user: null as unknown },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authMocks.auth,
}));

vi.mock("../AppDownloadScreen", () => ({
  AppDownloadScreen: ({ audience }: { audience: string }) => (
    <div>Download screen for {audience}</div>
  ),
}));

function makeUser(userType: string, roleKey = "school.admin") {
  return { userType, activeMembership: { roleKey } };
}

describe("AppDownloadGate", () => {
  it("replaces dashboard children for a parent", () => {
    authMocks.auth = { isLoading: false, user: makeUser("PARENT") };

    render(
      <AppDownloadGate>
        <div>Dashboard content</div>
      </AppDownloadGate>,
    );

    expect(screen.getByText("Download screen for parent")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("passes dashboard children through for a school admin", () => {
    authMocks.auth = { isLoading: false, user: makeUser("SCHOOL_USER") };

    render(
      <AppDownloadGate>
        <div>Dashboard content</div>
      </AppDownloadGate>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingLayout from "../layout";

vi.mock("@/components/ui/toast/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

describe("OnboardingLayout", () => {
  it("renders onboarding content inside its own standalone main layout", async () => {
    render(
      await OnboardingLayout({
        children: <div>Onboarding setup content</div>,
      }),
    );

    expect(
      screen.getByRole("main", { name: "layout.label" }),
    ).toContainElement(screen.getByText("Onboarding setup content"));
  });
});

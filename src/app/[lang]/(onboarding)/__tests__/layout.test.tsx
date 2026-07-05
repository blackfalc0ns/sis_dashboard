import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingLayout from "../layout";

vi.mock("@/components/ui/toast/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("OnboardingLayout", () => {
  it("renders onboarding content inside its own standalone main layout", () => {
    render(
      <OnboardingLayout>
        <div>Onboarding setup content</div>
      </OnboardingLayout>,
    );

    expect(
      screen.getByRole("main", { name: "Onboarding setup" }),
    ).toContainElement(screen.getByText("Onboarding setup content"));
  });
});

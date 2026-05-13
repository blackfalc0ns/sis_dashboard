import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UsernamePreviewCard from "../UsernamePreviewCard";

describe("UsernamePreviewCard Sprint 11 behavior", () => {
  it("shows the generated login email and unavailable username reason", () => {
    render(
      <UsernamePreviewCard
        username="taken"
        onUsernameChange={vi.fn()}
        preview={{ username: "taken", email: "taken@school.edu", loginEmail: "taken@school.edu" }}
        availability={{ username: "taken", available: false, reason: "Username already exists" }}
        error={null}
        isLoadingPreview={false}
        isCheckingAvailability={false}
        canUseActions
        onPreview={vi.fn()}
        onCheckAvailability={vi.fn()}
      />,
    );

    expect(screen.getByText("taken@school.edu")).toBeInTheDocument();
    expect(screen.getByText("Username already exists")).toBeInTheDocument();
  });
});

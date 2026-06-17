import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuickActionPanel from "@/features/dashboard/components/QuickActionPanel";
import { createAnnouncement } from "@/features/communication/api/communication.service";

const toastSpies = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  createAnnouncement: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: toastSpies.showError,
    showSuccess: toastSpies.showSuccess,
  }),
}));

const mockedCreateAnnouncement = vi.mocked(createAnnouncement);

describe("QuickActionPanel", () => {
  beforeEach(() => {
    mockedCreateAnnouncement.mockReset();
    toastSpies.showError.mockClear();
    toastSpies.showSuccess.mockClear();
  });

  it("creates a school-wide announcement draft directly from the dashboard", async () => {
    const user = userEvent.setup();
    mockedCreateAnnouncement.mockResolvedValue({
      data: { id: "announcement-1" },
    } as Awaited<ReturnType<typeof createAnnouncement>>);

    render(<QuickActionPanel />);

    await user.type(screen.getByLabelText("Title"), "Term opening");
    await user.type(screen.getByLabelText("Body"), "Welcome back tomorrow.");
    await user.click(screen.getByRole("button", { name: /create draft/i }));

    await waitFor(() => {
      expect(mockedCreateAnnouncement).toHaveBeenCalledWith({
        title: "Term opening",
        body: "Welcome back tomorrow.",
        status: "draft",
        priority: "normal",
        audienceType: "school",
      });
    });
    expect(toastSpies.showSuccess).toHaveBeenCalledWith(
      "Announcement draft created.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Body")).toHaveValue("");
  });

  it("shows validation feedback instead of calling the API for empty content", async () => {
    const user = userEvent.setup();

    render(<QuickActionPanel />);

    await user.click(screen.getByRole("button", { name: /create draft/i }));

    expect(screen.getByText("Enter a title.")).toBeInTheDocument();
    expect(mockedCreateAnnouncement).not.toHaveBeenCalled();
  });
});

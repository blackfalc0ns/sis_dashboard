import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileCorrectionRequestDetailPage from "../ProfileCorrectionRequestDetailPage";
import {
  fetchProfileCorrectionRequestById,
  approveProfileCorrectionRequest,
  rejectProfileCorrectionRequest,
} from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// Mock permissions
vi.mock("@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities", () => ({
  getStudentsGuardiansCapabilities: () => ({
    canViewProfileCorrectionRequests: true,
    canReviewProfileCorrectionRequests: true,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

// Mock api service
vi.mock("@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService", () => ({
  fetchProfileCorrectionRequestById: vi.fn(),
  approveProfileCorrectionRequest: vi.fn(),
  rejectProfileCorrectionRequest: vi.fn(),
}));

const mockRequest = {
  id: "req-1",
  studentId: "STU001",
  studentName: "John Doe",
  status: "PENDING" as const,
  changeCount: 1,
  requestedAt: "2026-07-02",
  changes: [
    {
      field: "firstName",
      label: "First Name",
      currentValue: "Jon",
      requestedValue: "John",
    },
  ],
};

describe("ProfileCorrectionRequestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    vi.mocked(fetchProfileCorrectionRequestById).mockResolvedValue(mockRequest);
  });

  it("renders detail page elements with UI primitives", async () => {
    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(fetchProfileCorrectionRequestById).toHaveBeenCalledWith("req-1");
    });

    // Check Back button
    const backButton = screen.getByRole("button", { name: /Back to queue/i });
    expect(backButton).toBeInTheDocument();
    // It should have the ghost variant class name from the Button primitive
    expect(backButton.className).toContain("bg-transparent");
    expect(backButton.className).toContain("hover:bg-gray-100");
    // It should render ChevronLeft icon
    const backIcon = backButton.querySelector("svg");
    expect(backIcon).toBeInTheDocument();

    // Check student name and changes table
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Jon")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();

    // Check Reviewer note uses TextArea
    const textarea = screen.getByRole("textbox", { name: /Reviewer note/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
    // TextArea component has the wrapper div & standard classes
    expect(textarea.className).toContain("resize-y");

    // Check Approve and Reject buttons use Button with variant classes
    const approveButton = screen.getByRole("button", { name: /Approve/i });
    const rejectButton = screen.getByRole("button", { name: /Reject/i });
    
    expect(approveButton.className).toContain("bg-green-600");
    expect(rejectButton.className).toContain("bg-red-600");
  });

  it("handles approving the profile correction request", async () => {
    vi.mocked(approveProfileCorrectionRequest).mockResolvedValue({
      ...mockRequest,
      status: "APPROVED",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /Reviewer note/i });
    fireEvent.change(textarea, { target: { value: "Approved note" } });

    const approveButton = screen.getByRole("button", { name: /Approve/i });
    await act(async () => {
      fireEvent.click(approveButton);
    });

    expect(window.confirm).toHaveBeenCalledWith("Confirm approve?");
    expect(approveProfileCorrectionRequest).toHaveBeenCalledWith("req-1", {
      reviewerNote: "Approved note",
    });
    expect(textarea).toHaveValue("");
  });

  it("handles rejecting the profile correction request", async () => {
    vi.mocked(rejectProfileCorrectionRequest).mockResolvedValue({
      ...mockRequest,
      status: "REJECTED",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /Reviewer note/i });
    fireEvent.change(textarea, { target: { value: "Rejected note" } });

    const rejectButton = screen.getByRole("button", { name: /Reject/i });
    await act(async () => {
      fireEvent.click(rejectButton);
    });

    expect(window.confirm).toHaveBeenCalledWith("Confirm reject?");
    expect(rejectProfileCorrectionRequest).toHaveBeenCalledWith("req-1", {
      reviewerNote: "Rejected note",
    });
    expect(textarea).toHaveValue("");
  });

  it("disables review note textarea and action buttons when request is not PENDING", async () => {
    vi.mocked(fetchProfileCorrectionRequestById).mockResolvedValue({
      ...mockRequest,
      status: "APPROVED",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /Reviewer note/i });
    expect(textarea).toBeDisabled();

    const approveButton = screen.getByRole("button", { name: /Approve/i });
    const rejectButton = screen.getByRole("button", { name: /Reject/i });
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });
});

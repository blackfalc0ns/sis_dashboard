import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchoolOnboardingPage from "../pages/SchoolOnboardingPage";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({
  useSetupStatus: vi.fn(),
}));

vi.mock("../hooks/useSetupStatus", () => ({
  useSetupStatus: hookMock.useSetupStatus,
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: { status: "success", data: { stages: [], grades: [], sections: [], classrooms: [] } },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

const evaluation: SetupEvaluation = {
  completedCount: 5,
  totalCount: 5,
  progressPercent: 100,
  isComplete: true,
  steps: {
    organization: { id: "organization", status: "complete", isComplete: true, lockedBy: [] },
    academicContext: { id: "academicContext", status: "complete", isComplete: true, lockedBy: [] },
    structure: { id: "structure", status: "complete", isComplete: true, lockedBy: [] },
    subjects: { id: "subjects", status: "complete", isComplete: true, lockedBy: [] },
    rooms: { id: "rooms", status: "complete", isComplete: true, lockedBy: [] },
  },
};

describe("SchoolOnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookMock.useSetupStatus.mockReturnValue({
      snapshot,
      evaluation,
      selectedYear: null,
      selectedTerm: null,
      schoolId: "school-1",
      refreshStep: vi.fn(),
      retryStep: vi.fn(),
    });
  });

  it("always renders the permanent full setup page even when complete", () => {
    render(<SchoolOnboardingPage />);

    expect(screen.getByRole("heading", { name: "School setup" })).toBeVisible();
    expect(screen.getByText("5/5 complete (100%)")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Dismiss setup guide" })).not.toBeInTheDocument();
  });
});

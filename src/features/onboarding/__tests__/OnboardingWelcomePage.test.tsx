import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingWelcomePage from "../pages/OnboardingWelcomePage";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({ useSetupStatus: vi.fn() }));
const navigationMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("../hooks/useSetupStatus", () => ({
  useSetupStatus: hookMock.useSetupStatus,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => navigationMock,
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: {
    status: "success",
    data: { stages: [], grades: [], sections: [], classrooms: [] },
  },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

function evaluation(isComplete: boolean): SetupEvaluation {
  const status = isComplete ? "complete" : "available";

  return {
    completedCount: isComplete ? 5 : 0,
    totalCount: 5,
    progressPercent: isComplete ? 100 : 0,
    isComplete,
    steps: {
      organization: {
        id: "organization",
        status,
        isComplete,
        lockedBy: [],
      },
      academicContext: {
        id: "academicContext",
        status,
        isComplete,
        lockedBy: [],
      },
      structure: { id: "structure", status, isComplete, lockedBy: [] },
      subjects: { id: "subjects", status, isComplete, lockedBy: [] },
      rooms: { id: "rooms", status, isComplete, lockedBy: [] },
    },
  };
}

function mockStatus(currentSnapshot = snapshot, isComplete = false) {
  hookMock.useSetupStatus.mockReturnValue({
    snapshot: currentSnapshot,
    evaluation: evaluation(isComplete),
    selectedYear: null,
    selectedTerm: null,
    schoolId: "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}

describe("OnboardingWelcomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus();
  });

  it("introduces all setup stages when setup is incomplete", () => {
    render(<OnboardingWelcomePage />);

    expect(
      screen.getByRole("heading", { name: "Welcome to your school workspace" }),
    ).toBeVisible();
    expect(screen.getByText("Organization")).toBeVisible();
    expect(screen.getByText("Academic year and terms")).toBeVisible();
    expect(screen.getByText("Academic structure")).toBeVisible();
    expect(screen.getByText("Subjects and allocations")).toBeVisible();
    expect(screen.getByText("Rooms")).toBeVisible();
  });

  it("opens the localized setup workflow", async () => {
    const user = userEvent.setup();
    render(<OnboardingWelcomePage />);

    await user.click(screen.getByRole("button", { name: "Start setup" }));

    expect(navigationMock.push).toHaveBeenCalledWith(
      "/en/settings/onboarding/setup",
    );
  });

  it("shows a loading state while setup status is loading", () => {
    mockStatus({ ...snapshot, rooms: { status: "loading", data: [] } });
    render(<OnboardingWelcomePage />);

    expect(screen.getByText("Preparing your setup…")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Start setup" }),
    ).not.toBeInTheDocument();
  });

  it("returns completed schools to the dashboard", async () => {
    mockStatus(snapshot, true);
    render(<OnboardingWelcomePage />);

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/en/dashboard");
    });
    expect(
      screen.queryByRole("button", { name: "Start setup" }),
    ).not.toBeInTheDocument();
  });
});

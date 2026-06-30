import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardsOverviewPage from "../RewardsOverviewPage";

const permissionState = vi.hoisted(() => ({
  permissions: ["reinforcement.rewards.view"] as string[],
}));

const dashboardMocks = vi.hoisted(() => ({
  getRewardsOverview: vi.fn(),
  getRewardCatalogSummary: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock(
  "@/features/reinforcement/services/rewardDashboardService",
  () => dashboardMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

vi.mock("@/features/reinforcement/components/ReinforcementAcademicContextFilter", () => ({
  default: ({ value, onChange }: any) => (
    <div data-testid="academic-filter">
      <button
        onClick={() =>
          onChange({
            academicYearId: "year-1",
            termId: "term-1",
            studentId: "student-123",
          })
        }
      >
        Select Student 123
      </button>
    </div>
  ),
}));

function renderPage() {
  return render(
    <ToastProvider>
      <RewardsOverviewPage />
    </ToastProvider>,
  );
}

describe("RewardsOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    dashboardMocks.getRewardsOverview.mockResolvedValue({
      catalog: { total: 10, published: 5 },
      redemptions: { pending: 2 },
      fulfillment: { completed: 3 },
      xp: { granted: 100 },
      topRequestedRewards: [],
      recentRedemptions: [],
      lowStockRewards: [],
    });

    dashboardMocks.getRewardCatalogSummary.mockResolvedValue({
      summary: { total: 10 },
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      students: [],
    });
  });

  it("calls getRewardsOverview and getRewardCatalogSummary with query parameters on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenCalled();
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalled();
    });
  });

  it("refetches overview with selected student when student is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    const selectBtn = await screen.findByText("Select Student 123");
    await user.click(selectBtn);

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          studentId: "student-123",
        }),
      );
    });
  });

  it("blocks fetching and displays validation error when dateFrom is after dateTo", async () => {
    const user = userEvent.setup();
    renderPage();

    const dateFromInput = await screen.findByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = await screen.findByLabelText("rewardsModule.overview.dateTo");

    await user.type(dateFromInput, "2026-06-30");
    await user.type(dateToInput, "2026-06-25");

    await waitFor(() => {
      expect(
        screen.getByText("rewardsModule.overview.errors.invalidDates"),
      ).toBeInTheDocument();
    });
  });
});

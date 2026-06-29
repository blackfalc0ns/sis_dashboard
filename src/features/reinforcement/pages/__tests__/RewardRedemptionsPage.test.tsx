import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardRedemptionsPage from "../RewardRedemptionsPage";

const authState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

const redemptionMocks = vi.hoisted(() => ({
  listRewardRedemptions: vi.fn(),
  createRewardRedemption: vi.fn(),
  approveRewardRedemption: vi.fn(),
  rejectRewardRedemption: vi.fn(),
  fulfillRewardRedemption: vi.fn(),
  cancelRewardRedemption: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  listRewardCatalog: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      id: "admin-1",
      activeMembership: {
        permissions: authState.permissions,
      },
    },
  }),
}));

vi.mock(
  "@/features/reinforcement/services/rewardRedemptionsService",
  () => redemptionMocks,
);
vi.mock(
  "@/features/reinforcement/services/rewardCatalogService",
  () => catalogMocks,
);
vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

const requestedRedemption = {
  id: "redemption-requested",
  catalogItemId: "reward-1",
  studentId: "student-1",
  status: "requested" as const,
  requestSource: "dashboard" as const,
  requestedAt: "2026-06-29T10:00:00.000Z",
  student: { name: "Student One", nameAr: "الطالب الأول" },
  catalogItem: { id: "reward-1", titleEn: "Gold Badge", titleAr: "شارة ذهبية" },
};

const approvedRedemption = {
  id: "redemption-approved",
  catalogItemId: "reward-2",
  studentId: "student-2",
  status: "approved" as const,
  requestSource: "teacher" as const,
  requestedAt: "2026-06-29T11:00:00.000Z",
  student: { name: "Student Two", nameAr: "الطالب الثاني" },
  catalogItem: { id: "reward-2", titleEn: "Book Voucher", titleAr: "قسيمة كتاب" },
};

function renderPage() {
  render(
    <ToastProvider>
      <RewardRedemptionsPage />
    </ToastProvider>,
  );
}

function mockSuccessfulLookups() {
  filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
    students: [
      {
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        nameEn: "Student One",
        nameAr: "الطالب الأول",
      },
    ],
  });
  catalogMocks.listRewardCatalog.mockResolvedValue({
    items: [
      {
        id: "reward-1",
        titleEn: "Gold Badge",
        titleAr: "شارة ذهبية",
        status: "published",
        minTotalXp: 50,
      },
    ],
  });
}

async function openCreateModal() {
  const user = userEvent.setup();
  renderPage();
  await user.click(
    await screen.findByRole("button", {
      name: "rewardsModule.redemptions.create.button",
    }),
  );
  await screen.findByText("rewardsModule.redemptions.create.title");
  return user;
}

async function selectCreateModalOptions(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() =>
    expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled(),
  );

  await user.click(
    screen.getByRole("button", {
      name: "rewardsModule.redemptions.create.student",
    }),
  );
  await user.click(await screen.findByRole("button", { name: "Student One" }));

  await user.click(
    screen.getByRole("button", {
      name: "rewardsModule.redemptions.create.reward",
    }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Gold Badge · 50 XP" }),
  );
}

describe("RewardRedemptionsPage", () => {
  beforeEach(() => {
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.request",
      "reinforcement.rewards.redemptions.review",
      "reinforcement.rewards.fulfill",
    ];
    redemptionMocks.listRewardRedemptions.mockReset().mockResolvedValue({
      items: [requestedRedemption, approvedRedemption],
      total: 2,
    });
    redemptionMocks.createRewardRedemption.mockReset().mockResolvedValue({
      ...requestedRedemption,
      id: "created-redemption",
    });
    redemptionMocks.approveRewardRedemption.mockReset();
    redemptionMocks.rejectRewardRedemption.mockReset();
    redemptionMocks.fulfillRewardRedemption.mockReset();
    redemptionMocks.cancelRewardRedemption.mockReset();
    catalogMocks.listRewardCatalog.mockReset();
    filterOptionMocks.getReinforcementFilterOptions.mockReset();
    mockSuccessfulLookups();
  });

  it("shows create and cancel only with request permission", async () => {
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.request",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", {
        name: "rewardsModule.redemptions.create.button",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: "rewardsModule.actions.cancel",
      }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.reject" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).not.toBeInTheDocument();
  });

  it("shows approve and reject only with review permission", async () => {
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.review",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", { name: "rewardsModule.actions.approve" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "rewardsModule.actions.reject" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "rewardsModule.redemptions.create.button",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.cancel" }),
    ).not.toBeInTheDocument();
  });

  it("shows fulfill only with fulfill permission", async () => {
    cleanup();

    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.fulfill",
    ];
    renderPage();

    expect(
      await screen.findByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.approve" }),
    ).not.toBeInTheDocument();
  });

  it("creates a dashboard redemption request and refreshes the list", async () => {
    const user = await openCreateModal();

    await selectCreateModalOptions(user);
    const listCallsBeforeSubmit =
      redemptionMocks.listRewardRedemptions.mock.calls.length;
    await user.type(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
      "  Please prepare it today.  ",
    );
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.redemptions.create.submit",
      }),
    );

    await waitFor(() =>
      expect(redemptionMocks.createRewardRedemption).toHaveBeenCalledWith({
        catalogItemId: "reward-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        requestSource: "dashboard",
        requestNoteEn: "Please prepare it today.",
      }),
    );
    await waitFor(() =>
      expect(redemptionMocks.listRewardRedemptions.mock.calls.length).toBeGreaterThan(
        listCallsBeforeSubmit,
      ),
    );
  });

  it("keeps the page and create modal usable when lookups fail", async () => {
    filterOptionMocks.getReinforcementFilterOptions.mockRejectedValue(
      new Error("Lookup unavailable"),
    );

    await openCreateModal();

    expect(await screen.findByText("Lookup unavailable")).toBeInTheDocument();
    expect(screen.getByText("Student One")).toBeInTheDocument();
    expect(
      screen.getByText("rewardsModule.redemptions.create.title"),
    ).toBeInTheDocument();
  });

  it("keeps create selections and notes when submit fails", async () => {
    redemptionMocks.createRewardRedemption.mockRejectedValue(
      new Error("Create failed"),
    );
    const user = await openCreateModal();

    await selectCreateModalOptions(user);
    await user.type(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
      "Keep this note",
    );
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.redemptions.create.submit",
      }),
    );

    expect(await screen.findAllByText("Create failed")).not.toHaveLength(0);
    const modal = screen
      .getByText("rewardsModule.redemptions.create.title")
      .closest("[role='dialog']");
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getByText("Student One")).toBeInTheDocument();
    expect(
      within(modal as HTMLElement).getByText("Gold Badge · 50 XP"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
    ).toHaveValue("Keep this note");
  });
});

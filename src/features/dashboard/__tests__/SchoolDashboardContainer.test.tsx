import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import SchoolDashboardContainer from "@/features/dashboard/container/SchoolDashboardContainer";
import {
  fetchDashboardActivityFeed,
  fetchDashboardAlerts,
  fetchDashboardSummary,
} from "@/features/dashboard/services/dashboardApiService";
import {
  dashboardActivityFeedResponse,
  dashboardAlertsResponse,
  dashboardSummaryResponse,
} from "@/features/dashboard/__tests__/dashboardTestFixtures";

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ isInitializing: false }),
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchDashboardSummary: vi.fn(),
  fetchDashboardAlerts: vi.fn(),
  fetchDashboardActivityFeed: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  createAnnouncement: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

const mockedFetchDashboardSummary = vi.mocked(fetchDashboardSummary);
const mockedFetchDashboardAlerts = vi.mocked(fetchDashboardAlerts);
const mockedFetchDashboardActivityFeed = vi.mocked(fetchDashboardActivityFeed);

describe("SchoolDashboardContainer", () => {
  beforeEach(() => {
    mockedFetchDashboardSummary.mockReset();
    mockedFetchDashboardAlerts.mockReset();
    mockedFetchDashboardActivityFeed.mockReset();
  });

  it("renders backend dashboard data when all endpoints succeed", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("School command center")).toBeInTheDocument();
    expect(screen.getByText("Active Students")).toBeInTheDocument();
    expect(screen.getAllByText("125").length).toBeGreaterThan(0);
    expect(screen.getByText(/Absences marked today/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admissions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Academics setup" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Operations" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();
    expect(screen.queryByText("Reinforcement")).not.toBeInTheDocument();
    expect(
      screen.getByText("Attendance session submitted"),
    ).toBeInTheDocument();
    expect(screen.getByText("add_student")).toBeInTheDocument();
    expect(screen.getByText("Admin: School Admin")).toBeInTheDocument();
    expect(
      screen.getAllByText("Analytics charts are not available in this version.")
        .length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(
      screen.getByText("KPI: Active Students - Value"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/more rows will be included in the exported file/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Alert: attendance.absent_entries_today - Title"),
    ).not.toBeInTheDocument();
    expect(mockedFetchDashboardAlerts).toHaveBeenCalledWith({ limit: 6 });
    expect(mockedFetchDashboardActivityFeed).toHaveBeenCalledWith({ limit: 5 });
  });

  it("moves secondary module cards behind tabs", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("School command center")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Academics" }));

    expect(screen.getByRole("tab", { name: "Academics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("Grades")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Operations" }));

    expect(screen.getByRole("tab", { name: "Operations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Reinforcement")).toBeInTheDocument();
  });

  it("renders dashboard alerts as a single action required panel", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [
          {
            key: "settings.login_identity_missing",
            source: "settings",
            severity: "critical",
            title: "Login identity is not configured",
            description:
              "Students and staff may not be able to access the portal.",
            count: 1,
            action: {
              label: "Configure now",
              target: "/settings/identity",
            },
          },
          {
            key: "communication.email_inactive",
            source: "communication",
            severity: "warning",
            title: "School email connection inactive",
            description:
              "Outbound email notifications may not reach families.",
            count: 1,
            action: {
              label: "Open email settings",
              target: "/communication/settings/email",
            },
          },
        ],
        summary: {
          total: 2,
          critical: 1,
          warning: 1,
          info: 0,
          bySource: {
            settings: 1,
            communication: 1,
          },
        },
      }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("Action Required")).toBeInTheDocument();
    expect(screen.getByText("Needs attention: 2 issues")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/en/attendance/reports",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/settings",
    );
    expect(
      screen.getByText("Login identity is not configured"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Students and staff may not be able to access the portal.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Configure now" }),
    ).toHaveAttribute("href", "/en/settings/identity");
    expect(
      screen.getByText("School email connection inactive"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Outbound email notifications may not reach families."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open email settings" }),
    ).toHaveAttribute("href", "/en/communication/settings/email");
  });

  it("renders empty operational states when alerts and activity are empty", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(
      dashboardSummaryResponse({ cards: {} }),
    );
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({ alerts: [] }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({ items: [] }),
    );

    render(<SchoolDashboardContainer />);

    expect(
      await screen.findByText("No active dashboard alerts"),
    ).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("links dashboard activity overflow to the recent activities page", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({
        pageInfo: {
          limit: 1,
          nextCursor: "cursor-2",
          hasMore: true,
        },
      }),
    );

    render(<SchoolDashboardContainer />);

    await screen.findByText("School command center");

    const loadMoreLink = await screen.findByRole("link", { name: /load more/i });

    expect(loadMoreLink).toHaveAttribute(
      "href",
      "/en/dashboard/recent-activities",
    );
  });

  it("links dashboard alert overflow to the alerts page", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [
          dashboardAlertFixture("settings.login_identity_missing", "settings"),
          dashboardAlertFixture("communication.reports_waiting", "communication"),
          dashboardAlertFixture("communication.email_inactive", "communication"),
          dashboardAlertFixture("admissions.pending_decisions", "admissions"),
          dashboardAlertFixture("reinforcement.hidden_task", "reinforcement"),
          dashboardAlertFixture("reinforcement.overdue_tasks", "reinforcement"),
          dashboardAlertFixture("communication.extra_warning", "communication"),
        ],
        summary: {
          total: 8,
          critical: 2,
          warning: 6,
          info: 0,
          bySource: {
            settings: 1,
            communication: 2,
            admissions: 3,
            reinforcement: 2,
          },
        },
      }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    await screen.findByText("School command center");

    const alertsLink = screen.getByRole("link", { name: "View all alerts" });

    expect(alertsLink).toHaveAttribute("href", "/en/dashboard/alerts");
    expect(screen.getByText("Needs attention: 8 issues")).toBeInTheDocument();
    expect(
      screen.queryByText("reinforcement.overdue_tasks"),
    ).not.toBeInTheDocument();
  });

  it("keeps successful endpoint sections visible when one dashboard endpoint fails", async () => {
    mockedFetchDashboardSummary.mockRejectedValue(new Error("Forbidden"));
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(
      await screen.findByText("Dashboard unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("KPI cards unavailable")).toBeInTheDocument();
    expect(screen.getByText("Dashboard cards unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Forbidden")).toHaveLength(3);
    expect(screen.getByText("Action Required")).toBeInTheDocument();
    expect(screen.getByText("Absences marked today")).toBeInTheDocument();
    expect(screen.getByText("Recent activities")).toBeInTheDocument();
    expect(screen.getByText("Attendance session submitted")).toBeInTheDocument();
  });
});

function dashboardAlertFixture(
  key: string,
  source: "admissions" | "communication" | "reinforcement" | "settings",
) {
  return {
    key,
    source,
    severity: source === "settings" ? "critical" : "warning",
    title: key,
    description: `${key} needs attention.`,
    count: 1,
    action: {
      label: `Open ${source}`,
      target: `/${source}`,
    },
  } as const;
}

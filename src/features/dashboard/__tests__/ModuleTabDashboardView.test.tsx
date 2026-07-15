import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModuleTabDashboardView from "../components/ModuleTabDashboardView";
import "@/features/dashboard/__tests__/dashboardI18nMock";

vi.mock("@mui/x-charts/LineChart", () => ({
  LineChart: () => <div data-testid="line-chart">MUI Line Chart Mock</div>,
}));

vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: () => <div data-testid="bar-chart">MUI Bar Chart Mock</div>,
}));

describe("ModuleTabDashboardView", () => {
  const mockPageData: any = {
    module: {
      moduleKey: "academics",
      source: "academics",
      title: "Academics",
      description: "Academics Module Description",
      status: "available",
      iconKey: "graduation-cap",
      tone: "info",
      frontendRoute: "/academics",
      sourceRoute: "/academics",
    },
    overview: {
      quickStats: [
        { key: "homework", label: "Homework Pending", value: 5, tone: "info", iconKey: "book-open" },
        { key: "grades", label: "Grades Published", value: 12, tone: "success", iconKey: "book-open" },
      ],
      risks: [
        {
          key: "attendance.low",
          severity: "critical",
          title: "Low attendance rate detected",
          count: 3,
          source: "attendance",
          action: { label: "Review", target: "/attendance/review" },
        },
      ],
      actions: [
        {
          key: "grades.approve",
          priority: "high",
          label: "Approve grades",
          description: "Term 1 grades are pending approval",
          source: "grades",
          action: { label: "Open grades", target: "/grades/approve" },
        },
      ],
    },
    widgets: [
      {
        widgetKey: "academics.homework_today",
        type: "stat-card",
        source: "homework",
        title: "Homework Today",
        subtitle: "Assigned today",
        iconKey: "book-open",
        tone: "info",
        data: { value: 8 },
        action: null,
        emptyState: null,
        meta: {},
      },
      {
        widgetKey: "reinforcement.tasks",
        type: "progress-card",
        source: "reinforcement",
        title: "Reinforcement Tasks",
        subtitle: "Overall task progress",
        iconKey: "school",
        tone: "success",
        data: { percent: 75 },
        action: null,
        emptyState: null,
        meta: {},
      },
    ],
    analytics: {
      charts: [
        {
          chartKey: "academics.gpa_trend",
          chartType: "line",
          title: "GPA Trend",
          subtitle: "Class average GPA",
          source: "grades",
          series: ["GPA"],
        },
      ],
      availableData: [
        {
          chartKey: "academics.gpa_trend",
          series: [
            {
              name: "GPA",
              data: [3.2, 3.4, 3.5],
              labels: ["Term 1", "Term 2", "Term 3"],
            },
          ],
          totals: {},
          summary: null,
          empty: false,
        },
      ],
    },
  };

  it("renders module identity details, quick stats, risks, next actions, and charts", () => {
    render(<ModuleTabDashboardView pageData={mockPageData} pathname="/en/dashboard" />);

    // Identity
    expect(screen.getByText("Academics")).toBeInTheDocument();
    expect(screen.getByText("Academics Module Description")).toBeInTheDocument();

    // Quick Stats
    expect(screen.getByText("Homework Pending")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Grades Published")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Risks
    expect(screen.getByText("Low attendance rate detected")).toBeInTheDocument();
    expect(screen.getByText("Count: 3")).toBeInTheDocument();

    // Next Actions
    expect(screen.getByText("Approve grades")).toBeInTheDocument();
    expect(screen.getByText("Term 1 grades are pending approval")).toBeInTheDocument();

    // Widgets
    expect(screen.getByText("Homework Today")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Reinforcement Tasks")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    // Charts
    expect(screen.getByText("GPA Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});

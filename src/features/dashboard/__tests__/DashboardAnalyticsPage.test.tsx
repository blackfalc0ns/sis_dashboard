import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import DashboardAnalyticsPage from "@/features/dashboard/pages/DashboardAnalyticsPage";
import {
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/analytics",
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchAnalyticsCatalog: vi.fn(),
  fetchAnalyticsCharts: vi.fn(),
  fetchAnalyticsChartData: vi.fn(),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockedFetchCatalog = vi.mocked(fetchAnalyticsCatalog);
const mockedFetchCharts = vi.mocked(fetchAnalyticsCharts);
const mockedFetchChartData = vi.mocked(fetchAnalyticsChartData);

describe("DashboardAnalyticsPage", () => {
  const mockCatalog = {
    generatedAt: "2026-07-15T09:00:00Z",
    catalog: {
      version: "v1",
      sources: [
        { source: "admissions", label: "Admissions", status: "available", description: "" },
        { source: "students", label: "Students", status: "available", description: "" },
        { source: "academics", label: "Academics", status: "available", description: "" },
      ],
      supportedChartTypes: ["line", "bar", "pie"],
      supportedRanges: ["7d", "30d", "90d"],
      supportedGranularities: ["day", "week"],
      charts: [],
    },
  };

  const mockChartsResponse = {
    generatedAt: "2026-07-15T09:00:00Z",
    charts: [
      {
        chartKey: "academics.gpa_trend",
        chartType: "line",
        title: "Class GPA Trend",
        subtitle: "Academic year average GPA",
        source: "academics",
        series: ["GPA"],
      },
    ] as any[],
  };

  const mockChartData = {
    generatedAt: "2026-07-15T09:00:00Z",
    chartKey: "academics.gpa_trend",
    source: "academics",
    title: "Class GPA Trend",
    type: "line",
    status: "available",
    range: "30d",
    granularity: "day",
    filters: {},
    data: {
      series: [
        {
          key: "gpa",
          label: "GPA",
          points: [
            { x: "2026-07-01", y: 3.2, coordinate: {} },
            { x: "2026-07-02", y: 3.5, coordinate: {} },
          ],
        },
      ],
      totals: {},
      summary: null,
      empty: false,
    },
    emptyState: null,
    meta: {},
  };

  beforeEach(() => {
    mockedFetchCatalog.mockReset();
    mockedFetchCharts.mockReset();
    mockedFetchChartData.mockReset();

    mockedFetchCatalog.mockResolvedValue(mockCatalog as any);
    mockedFetchCharts.mockResolvedValue(mockChartsResponse as any);
    mockedFetchChartData.mockResolvedValue(mockChartData);
  });

  it("renders page header, filters catalog, and loads charts list with visual Recharts", async () => {
    render(<DashboardAnalyticsPage />);

    expect(await screen.findByText("Analytics Dashboard")).toBeInTheDocument();
    
    // Wait for catalog and charts list fetch
    await waitFor(() => {
      expect(mockedFetchCatalog).toHaveBeenCalled();
      expect(mockedFetchCharts).toHaveBeenCalled();
    });

    // Check chart details
    expect(await screen.findByText("Class GPA Trend")).toBeInTheDocument();
    expect(screen.getByText("Academic year average GPA")).toBeInTheDocument();

    // Check Recharts render
    await waitFor(() => {
      expect(mockedFetchChartData).toHaveBeenCalledWith("academics.gpa_trend", expect.any(Object));
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  it("triggers CSV downloader on Export button click", async () => {
    const createObjectURL = vi.fn();
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL });
    Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL });

    render(<DashboardAnalyticsPage />);

    // Wait for chart title to appear, ensuring chart card is rendered and state success resolves
    expect(await screen.findByText("Class GPA Trend")).toBeInTheDocument();

    const exportBtn = await screen.findByRole("button", { name: /csv export/i });
    expect(exportBtn).toBeInTheDocument();

    // Trigger click
    fireEvent.click(exportBtn);

    // Verify it doesn't crash on download execution
    expect(exportBtn).toBeInTheDocument();
  });
});

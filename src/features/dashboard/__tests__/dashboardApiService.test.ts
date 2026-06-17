import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import {
  dashboardQueryString,
  fetchDashboardActivityFeed,
  fetchDashboardAlerts,
  fetchDashboardSummary,
} from "@/features/dashboard/services/dashboardApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);

describe("dashboardApiService", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it("omits empty query parameters and preserves supported boolean and numeric values", () => {
    expect(
      dashboardQueryString({
        source: "attendance",
        severity: undefined,
        includeZeroCount: true,
        limit: 10,
        cursor: "",
      }),
    ).toBe("?source=attendance&includeZeroCount=true&limit=10");
  });

  it("requests the documented dashboard endpoint paths", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ generatedAt: "2026-06-13T10:00:00.000Z" })
      .mockResolvedValueOnce({ alerts: [] })
      .mockResolvedValueOnce({ items: [] });

    await fetchDashboardSummary();
    await fetchDashboardAlerts({ source: "attendance", limit: 5 });
    await fetchDashboardActivityFeed({ actorType: "admin", limit: 3 });

    expect(mockedApiGet).toHaveBeenNthCalledWith(1, "/dashboard/summary");
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/alerts?source=attendance&limit=5",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/dashboard/activity-feed?actorType=admin&limit=3",
    );
  });

  it("serializes the full activity feed query contract", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await fetchDashboardActivityFeed({
      source: "attendance",
      eventType: "attendance.session.submit",
      actorType: "admin",
      dateFrom: "2026-06-01T00:00:00.000Z",
      dateTo: "2026-06-13T23:59:59.999Z",
      limit: 20,
      cursor: "cursor-2",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/dashboard/activity-feed?source=attendance&eventType=attendance.session.submit&actorType=admin&dateFrom=2026-06-01T00%3A00%3A00.000Z&dateTo=2026-06-13T23%3A59%3A59.999Z&limit=20&cursor=cursor-2",
    );
  });

  it("unwraps API envelopes and reports envelope errors", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ data: { alerts: [] } })
      .mockResolvedValueOnce({ error: "Forbidden" });

    await expect(fetchDashboardAlerts()).resolves.toEqual({ alerts: [] });
    await expect(fetchDashboardAlerts()).rejects.toThrow("Forbidden");
  });
});

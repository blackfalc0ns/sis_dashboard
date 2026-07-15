import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LightModeDropdown from "@/components/ui/dropdown/LightModeDropdown";
import * as api from "@/features/dashboard/services/dashboardApiService";
import "@/features/dashboard/__tests__/dashboardI18nMock";

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchLightModeDropdown: vi.fn(),
  fetchDashboardTodos: vi.fn(),
  createDashboardTodo: vi.fn(),
  updateDashboardTodo: vi.fn(),
  deleteDashboardTodo: vi.fn(),
}));

const mockFetchDropdown = vi.mocked(api.fetchLightModeDropdown);

describe("LightModeDropdown Integration", () => {
  it("renders collapsed by default and fetches dropdown details when expanded", async () => {
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        resolvedTimezone: "Africa/Cairo",
        source: "school_profile",
      },
      weather: {
        status: "provider_not_configured",
        provider: null,
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather Unavailable",
          conditionCode: "provider_not_configured",
          iconKey: "cloud",
          observedAt: null,
        },
        emptyState: {
          reason: "provider_not_configured",
          message: "Weather provider is not configured.",
        },
      },
      hints: [],
      highlights: [],
      cities: [],
      forecast: [],
      planner: {
        timezone: "Africa/Cairo",
        date: "2026-07-15",
        eventDates: [],
        events: [],
        todos: [
          {
            todoId: "todo-1",
            date: "2026-07-15",
            title: "Configure admissions email template",
            notes: "Must be done by term start",
            status: "pending",
            priority: "high",
            sortOrder: 10,
            completedAt: null,
            createdAt: "2026-07-15T09:00:00.000Z",
            updatedAt: "2026-07-15T09:00:00.000Z",
          },
        ],
      },
      meta: {} as any,
    });

    render(<LightModeDropdown defaultExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText("Test Cairo Campus")).toBeInTheDocument();
      expect(screen.getByText("Configure admissions email template")).toBeInTheDocument();
      expect(screen.getByText("Weather Unavailable")).toBeInTheDocument();
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
const mockCreateTodo = vi.mocked(api.createDashboardTodo);
const mockUpdateTodo = vi.mocked(api.updateDashboardTodo);

describe("LightModeDropdown Integration", () => {
  it("loads dropdown details when the page opens", async () => {
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
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
    });

    render(<LightModeDropdown />);

    await waitFor(() => {
      expect(mockFetchDropdown).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "en",
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    await waitFor(() => {
      expect(screen.getByText("Configure admissions email template")).toBeInTheDocument();
      expect(screen.getByText("agenda")).toBeInTheDocument();
    });
  });

  it("uses the server-selected school date and persisted Todo ID when creating a Todo", async () => {
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
      },
      weather: {
        status: "provider_not_configured",
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather Unavailable",
        },
        emptyState: { message: "Weather provider is not configured." },
      },
      planner: {
        timezone: "Africa/Cairo",
        date: "2026-07-15",
        eventDates: [],
        todos: [],
      },
    });
    mockCreateTodo.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: {
        todoId: "todo-created",
        date: "2026-07-15",
        title: "Created Todo",
        notes: null,
        status: "pending",
        priority: "normal",
        sortOrder: 0,
        completedAt: null,
        createdAt: "2026-07-15T09:00:00.000Z",
        updatedAt: "2026-07-15T09:00:00.000Z",
      },
    });
    mockUpdateTodo.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: {
        todoId: "todo-created",
        date: "2026-07-15",
        title: "Created Todo",
        notes: null,
        status: "completed",
        priority: "normal",
        sortOrder: 0,
        completedAt: "2026-07-15T09:00:00.000Z",
        createdAt: "2026-07-15T09:00:00.000Z",
        updatedAt: "2026-07-15T09:00:00.000Z",
      },
    });

    render(<LightModeDropdown defaultExpanded />);

    await waitFor(() => {
      expect(mockFetchDropdown).toHaveBeenCalled();
    });
    fireEvent.change(screen.getByPlaceholderText("addTitle"), {
      target: { value: "Created Todo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        date: "2026-07-15",
        title: "Created Todo",
        notes: null,
        priority: "normal",
      });
    });

    await screen.findByText("Created Todo");
    fireEvent.click(screen.getByRole("button", { name: "markDone" }));

    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith("todo-created", {
        status: "completed",
      });
    });
  });
});

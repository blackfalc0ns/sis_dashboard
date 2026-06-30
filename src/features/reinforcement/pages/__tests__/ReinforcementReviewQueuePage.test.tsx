import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import ReinforcementReviewQueuePage from "../ReinforcementReviewQueuePage";

const permissionState = vi.hoisted(() => ({
  permissions: [
    "reinforcement.reviews.view",
    "reinforcement.reviews.manage",
  ] as string[],
}));

const reviewsMocks = vi.hoisted(() => ({
  listReinforcementReviewQueue: vi.fn(),
  approveReinforcementSubmission: vi.fn(),
  rejectReinforcementSubmission: vi.fn(),
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
  "@/features/reinforcement/services/reinforcementReviewsService",
  () => reviewsMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <ReinforcementReviewQueuePage />
    </ToastProvider>,
  );
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  labelName: string,
  optionText: string,
) {
  const trigger = await screen.findByLabelText(labelName);
  await user.click(trigger);
  const option = await screen.findByRole("button", { name: optionText });
  await user.click(option);
}

describe("ReinforcementReviewQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    reviewsMocks.listReinforcementReviewQueue.mockResolvedValue({
      items: [
        {
          id: "submission-1",
          studentId: "student-123",
          status: "submitted",
          submittedAt: "2026-06-30T00:00:00Z",
          task: { titleEn: "Read Book" },
          stage: { titleEn: "Page 10" },
          student: { nameEn: "John Doe" },
        },
      ],
      total: 1,
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "Year 1", nameAr: "Year 1" }],
      terms: [{ id: "term-1", nameEn: "Term 1", nameAr: "Term 1" }],
      students: [{ studentId: "student-123", nameEn: "Student 123", nameAr: "Student 123" }],
    });
  });

  it("calls listReinforcementReviewQueue and getReinforcementFilterOptions on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenCalled();
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled();
    });

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("refetches queue with parameters when filter changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.catalog.form.academicYear", "Year 1");
    await selectOption(user, "rewardsModule.catalog.form.term", "Term 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-123",
        }),
      );
    });
  });

  it("clears local filters and keeps academic context when Clear Filters is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.catalog.form.academicYear", "Year 1");
    await selectOption(user, "rewardsModule.catalog.form.term", "Term 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          studentId: "student-123",
        }),
      );
    });

    const clearBtn = await screen.findByText("rewardsModule.overview.clearFilters");
    await user.click(clearBtn);

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: undefined,
        }),
      );
    });
  });

  it("displays validation error and blocks queue list API call when dates are invalid", async () => {
    renderPage();

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenCalled();
    });

    const dateFromInput = screen.getByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = screen.getByLabelText("rewardsModule.overview.dateTo");

    reviewsMocks.listReinforcementReviewQueue.mockClear();

    // Set invalid date range: from > to
    fireEvent.change(dateFromInput, { target: { value: "2026-07-02" } });
    fireEvent.change(dateToInput, { target: { value: "2026-07-01" } });

    // Should display validation error
    expect(await screen.findByText("rewardsModule.overview.errors.invalidDates")).toBeInTheDocument();

    // Verify the list API call was blocked for this invalid combination
    expect(reviewsMocks.listReinforcementReviewQueue).not.toHaveBeenLastCalledWith(
      expect.objectContaining({
        submittedFrom: "2026-07-02",
        submittedTo: "2026-07-01",
      }),
    );

    // Change to valid date range
    fireEvent.change(dateToInput, { target: { value: "2026-07-03" } });

    // The validation error should disappear
    await waitFor(() => {
      expect(screen.queryByText("rewardsModule.overview.errors.invalidDates")).not.toBeInTheDocument();
    });

    // The API call should have been made with the valid dates
    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          submittedFrom: "2026-07-02",
          submittedTo: "2026-07-03",
        }),
      );
    });
  });
});

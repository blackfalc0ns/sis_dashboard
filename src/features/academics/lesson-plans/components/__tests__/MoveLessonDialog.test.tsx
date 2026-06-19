import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MoveLessonDialog from "../MoveLessonDialog";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn().mockRejectedValue(new Error("not configured")),
  listEntries: vi.fn(),
}));

describe("MoveLessonDialog", () => {
  it("moves without a timetable slot using the selected instructional day", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <MoveLessonDialog
        isOpen
        targetWeek={{
          weekIndex: 3,
          startDate: "2026-09-15",
          endDate: "2026-09-21",
          instructionalDays: ["2026-09-16", "2026-09-17"],
          holidayDays: [],
          lostTeachingDays: 0,
          hasHolidays: false,
          plannedItemsCount: 0,
        }}
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        academicYearId="year-1"
        termId="term-1"
        gradeId="grade-1"
        sectionId="section-1"
        classroomId="classroom-1"
        teacherUserId="teacher-1"
        subjectId="subject-1"
        teacherSubjectAllocationId="allocation-1"
        sortOrder={2}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Sep 16/i }));
    await user.click(screen.getByRole("button", { name: /Sep 17/i }));
    await user.click(screen.getByRole("button", { name: "actions.confirmMove" }));

    expect(onConfirm).toHaveBeenCalledWith({
      weekIndex: 3,
      plannedDate: "2026-09-17",
      dayOfWeek: 4,
      sortOrder: 2,
    });
  });
});

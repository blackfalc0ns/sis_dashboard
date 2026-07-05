import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, listEntries } from "@/features/academics/timetable/services/timetableApiAdapter";
import MoveLessonDialog from "../MoveLessonDialog";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  listEntries: vi.fn(),
}));

describe("MoveLessonDialog", () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockRejectedValue(new Error("not configured"));
    vi.mocked(listEntries).mockResolvedValue([]);
  });
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

    await user.click(screen.getByRole("button", { name: "plannedDay" }));
    await user.click(screen.getByRole("button", { name: /Sep 17/i }));
    await user.click(screen.getByRole("button", { name: "actions.confirmMove" }));

    expect(onConfirm).toHaveBeenCalledWith({
      weekIndex: 3,
      plannedDate: "2026-09-17",
      sortOrder: 2,
    });
  });

  it("moves with only the selected timetable entry id", async () => {
    vi.mocked(getConfig).mockReset().mockResolvedValue({ id: "config-1" } as never);
    vi.mocked(listEntries).mockReset().mockResolvedValue([
      {
        id: "entry-1",
        dayOfWeek: 3,
        periodId: "period-1",
        period: { label: "Period 1", index: 1 },
        teacherSubjectAllocationId: "allocation-1",
        status: "active",
      },
    ] as never);
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <MoveLessonDialog
        isOpen
        targetWeek={{
          weekIndex: 3,
          startDate: "2026-09-15",
          endDate: "2026-09-21",
          instructionalDays: ["2026-09-16"],
          holidayDays: [],
          lostTeachingDays: 0,
          hasHolidays: false,
          plannedItemsCount: 0,
        }}
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

    await user.click(
      await screen.findByRole("button", { name: "timetableSlotOptions.label" }),
    );
    await user.click(screen.getByRole("button", { name: "Period 1" }));
    await user.click(screen.getByRole("button", { name: "actions.confirmMove" }));

    expect(onConfirm).toHaveBeenCalledWith({
      weekIndex: 3,
      plannedDate: "2026-09-16",
      timetableEntryId: "entry-1",
      sortOrder: 2,
    });
  });
});

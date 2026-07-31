import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLessonPlan, createLessonPlanItem } from "../../services/lessonPlansService";
import LessonPlansBoard from "../LessonPlansBoard";

const showError = vi.fn();
const timetableConfigResult = vi.fn();

vi.mock("@mui/material", () => ({
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => "" } }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess: vi.fn() }),
}));

vi.mock("../TimetableSlotSelect", () => ({
  activeTimetableDates: (dates: string[]) => dates,
  useTimetableConfigForScope: () => timetableConfigResult(),
}));

vi.mock("../LessonLibrary", () => ({
  default: (props: {
    lessons: Array<{ id: string }>;
    onDragStart: (lesson: { id: string }) => void;
  }) => (
    <button onClick={() => props.onDragStart(props.lessons[0])}>
      drag lesson
    </button>
  ),
}));

vi.mock("../WeeksBoardDesktop", () => ({
  default: (props: { onDropOnWeek: (weekIndex: number) => void }) => (
    <button onClick={() => props.onDropOnWeek(1)}>drop lesson</button>
  ),
}));

vi.mock("../WeeksBoardMobile", () => ({ default: () => null }));
vi.mock("../ProgressSummary", () => ({ default: () => null }));
vi.mock("../EditLessonPlanDialog", () => ({ default: () => null }));
vi.mock("../SkipCancelReasonDialog", () => ({ default: () => null }));
vi.mock("../MoveLessonDialog", () => ({ default: () => null }));
vi.mock("../EditLessonPlanItemDialog", () => ({ default: () => null }));

vi.mock("../../services/lessonPlansService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/lessonPlansService")>();
  return {
    ...actual,
    createLessonPlan: vi.fn(),
    createLessonPlanItem: vi.fn(),
  };
});

const lesson = {
  id: "lesson-1",
  curriculumId: "curriculum-1",
  unitId: "unit-1",
  title: "Fractions",
  description: null,
  objectives: [],
  sortOrder: 0,
  estimatedMinutes: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const renderBoard = () =>
  render(
    <LessonPlansBoard
      academicYearId="year-1"
      termId="term-1"
      termStartDate="2026-09-01"
      termEndDate="2026-12-31"
      teacherSubjectAllocationId="allocation-1"
      curriculumId="curriculum-1"
      subjectId="subject-1"
      gradeId="grade-1"
      sectionId="section-1"
      classroomId="classroom-1"
      teacherId="teacher-1"
      lessons={[lesson]}
      units={[]}
      plans={[]}
      weeks={[
        {
          weekIndex: 1,
          startDate: "2026-09-01",
          endDate: "2026-09-07",
          instructionalDays: ["2026-09-02"],
          holidayDays: [],
          lostTeachingDays: 0,
          hasHolidays: false,
          plannedItemsCount: 0,
        },
      ]}
      summary={null}
      summaryLoading={false}
      summaryError={null}
      validation={null}
      isReadOnly={false}
      librarySearchQuery=""
      librarySelectedUnitId=""
      onLibrarySearchQueryChange={vi.fn()}
      onLibrarySelectedUnitIdChange={vi.fn()}
      onRefreshPlanDetail={vi.fn()}
      onRefreshSummaryAndValidation={vi.fn()}
      onUpsertPlan={vi.fn()}
      onRemovePlan={vi.fn()}
      onUpsertPlanItem={vi.fn()}
      onRemovePlanItem={vi.fn()}
      validationMessages={{
        noInstructionalDays: "validation.no_instructional_days",
        weekOutsideTerm: "validation.week_outside_term",
        plannedDateOutsideTerm: "validation.planned_date_outside_term",
      }}
    />,
  );

describe("LessonPlansBoard timetable metadata", () => {
  beforeEach(() => {
    showError.mockReset();
    vi.mocked(createLessonPlan).mockReset();
    vi.mocked(createLessonPlanItem).mockReset();
  });

  it("blocks drag creation and reports metadata load errors accurately", async () => {
    timetableConfigResult.mockReturnValue({
      config: null,
      isLoading: false,
      error: new Error("network"),
      isMissing: false,
    });
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: "drag lesson" }));
    await user.click(screen.getByRole("button", { name: "drop lesson" }));

    expect(showError).toHaveBeenCalledWith("timetableSlotOptions.loadError");
    expect(showError).not.toHaveBeenCalledWith(
      "validation.no_instructional_days",
    );
    expect(createLessonPlan).not.toHaveBeenCalled();
    expect(createLessonPlanItem).not.toHaveBeenCalled();
  });
});

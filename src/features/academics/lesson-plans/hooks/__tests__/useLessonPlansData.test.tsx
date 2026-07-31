import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchCurriculumForScope } from "@/features/academics/curriculum/services/curriculumService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  getLessonPlan,
  getLessonPlanSummary,
  getLessonPlanValidation,
  listLessonPlans,
  listLessonPlanWeeks,
  type LessonPlan,
} from "../../services/lessonPlansService";
import { useLessonPlansData } from "../useLessonPlansData";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(),
}));
vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({
  fetchCurriculumForScope: vi.fn(),
}));
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: vi.fn(),
  fetchSubjects: vi.fn(),
}));
vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherAllocations: vi.fn(),
  fetchTeachers: vi.fn(),
}));
vi.mock("../../services/lessonPlansService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/lessonPlansService")>()),
  getLessonPlan: vi.fn(),
  getLessonPlanSummary: vi.fn(),
  getLessonPlanValidation: vi.fn(),
  listLessonPlans: vi.fn(),
  listLessonPlanWeeks: vi.fn(),
}));

const summaryPlan = {
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  teacherId: "teacher-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
  curriculumId: "curriculum-1",
  title: "Week 1",
  description: null,
  status: "DRAFT",
  rawStatus: "draft",
  weekStartDate: "2026-09-01",
  weekEndDate: "2026-09-07",
  weekIndex: 0,
  items: [],
  updatedAt: "2026-09-01T00:00:00.000Z",
} satisfies LessonPlan;
const detailPlan = {
  ...summaryPlan,
  items: [
    {
      id: "item-1",
      planId: "plan-1",
      lessonId: "lesson-1",
      unitId: "unit-1",
      unitTitle: "Unit 1",
      lessonTitle: "Lesson 1",
      status: "PLANNED",
      rawStatus: "planned",
      order: 0,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
} satisfies LessonPlan;

describe("useLessonPlansData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjects).mockResolvedValue([]);
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([]);
    vi.mocked(fetchTeachers).mockResolvedValue([]);
    vi.mocked(fetchCurriculumForScope).mockResolvedValue({
      id: "curriculum-1",
      units: [],
    } as never);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
      },
    ]);
    vi.mocked(listLessonPlanWeeks).mockResolvedValue([
      {
        weekIndex: 1,
        startDate: "2026-09-01",
        endDate: "2026-09-07",
        instructionalDays: ["2026-09-01"],
        holidayDays: [],
        lostTeachingDays: 0,
        hasHolidays: false,
        plannedItemsCount: 1,
      },
    ]);
    vi.mocked(listLessonPlans).mockResolvedValue([summaryPlan]);
    vi.mocked(getLessonPlan).mockResolvedValue(detailPlan);
    vi.mocked(getLessonPlanSummary).mockResolvedValue({} as never);
    vi.mocked(getLessonPlanValidation).mockResolvedValue({} as never);
  });

  it("hydrates list summaries from detail before storing board plans", async () => {
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useLessonPlansData({
        academicYearId: "year-1",
        termId: "term-1",
        isInitializing: false,
        selectedGradeId: "grade-1",
        selectedSectionId: "section-1",
        selectedClassroomId: "",
        selectedSubjectId: "subject-1",
        onLoadError,
      }),
    );

    await waitFor(() => expect(result.current.dataChecked).toBe(true));

    expect(getLessonPlan).toHaveBeenCalledWith("plan-1");
    expect(result.current.plans[0]?.items).toEqual(detailPlan.items);
    expect(result.current.plans[0]?.weekIndex).toBe(1);
  });

  it("loads the selected classroom and subject scope once without duplicate requests", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [{ id: "classroom-1", sectionId: "section-1" }],
    } as never);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
      },
    ]);
    const onLoadError = vi.fn();
    const { result, rerender } = renderHook(
      ({ classroomId, subjectId }) =>
        useLessonPlansData({
          academicYearId: "year-1",
          termId: "term-1",
          isInitializing: false,
          selectedGradeId: "grade-1",
          selectedSectionId: "section-1",
          selectedClassroomId: classroomId,
          selectedSubjectId: subjectId,
          onLoadError,
        }),
      {
        initialProps: {
          classroomId: "",
          subjectId: "",
        },
      },
    );

    await waitFor(() =>
      expect(result.current.scopeStatus).toBe("missing-subject"),
    );
    vi.clearAllMocks();

    rerender({
      classroomId: "classroom-1",
      subjectId: "subject-1",
    });

    await waitFor(() => expect(result.current.scopeStatus).toBe("ready"));
    expect(fetchCurriculumForScope).toHaveBeenCalledTimes(1);
    expect(fetchTeacherAllocations).toHaveBeenCalledTimes(1);
    expect(listLessonPlanWeeks).toHaveBeenCalledTimes(1);
    expect(listLessonPlans).toHaveBeenCalledTimes(1);
    expect(getLessonPlanSummary).toHaveBeenCalledTimes(1);
    expect(getLessonPlanValidation).toHaveBeenCalledTimes(1);
  });

  it("does not resolve allocation or load lesson plans when the section requires a classroom", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [{ id: "classroom-1", sectionId: "section-1" }],
    } as never);
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useLessonPlansData({
        academicYearId: "year-1",
        termId: "term-1",
        isInitializing: false,
        selectedGradeId: "grade-1",
        selectedSectionId: "section-1",
        selectedClassroomId: "",
        selectedSubjectId: "subject-1",
        onLoadError,
      }),
    );

    await waitFor(() => expect(result.current.scopeStatus).toBe("missing-classroom"));
    expect(result.current.dataChecked).toBe(true);
    expect(fetchCurriculumForScope).not.toHaveBeenCalled();
    expect(fetchTeacherAllocations).not.toHaveBeenCalled();
    expect(listLessonPlans).not.toHaveBeenCalled();
  });
});

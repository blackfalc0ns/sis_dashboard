import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReinforcementAcademicContextFilter from "@/features/reinforcement/components/ReinforcementAcademicContextFilter";
import ReinforcementTaskTargetSelector from "@/features/reinforcement/components/ReinforcementTaskTargetSelector";

const academicMocks = vi.hoisted(() => ({
  fetchAcademicYears: vi.fn(),
  fetchTerms: vi.fn(),
  fetchAcademicStructureTree: vi.fn(),
}));

const subjectMocks = vi.hoisted(() => ({
  fetchSubjects: vi.fn(),
}));

const studentMocks = vi.hoisted(() => ({
  fetchStudentsWithEnrollmentForContext: vi.fn(),
}));

vi.mock("@/features/academics/services/academicStructureApiService", () => ({
  fetchAcademicYears: academicMocks.fetchAcademicYears,
  fetchTerms: academicMocks.fetchTerms,
  fetchAcademicStructureTree: academicMocks.fetchAcademicStructureTree,
}));

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: subjectMocks.fetchSubjects,
}));

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchStudentsWithEnrollmentForContext:
    studentMocks.fetchStudentsWithEnrollmentForContext,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      activeMembership: {
        schoolId: "school-1",
      },
    },
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const structureTree = {
  stages: [{ id: "stage-1", nameEn: "Primary", nameAr: "ابتدائي" }],
  grades: [
    {
      id: "grade-1",
      stageId: "stage-1",
      nameEn: "Grade 1",
      nameAr: "الصف الأول",
    },
  ],
  sections: [
    {
      id: "section-1",
      gradeId: "grade-1",
      nameEn: "Section A",
      nameAr: "شعبة أ",
    },
  ],
  classrooms: [
    {
      id: "classroom-1",
      sectionId: "section-1",
      nameEn: "Classroom 101",
      nameAr: "فصل 101",
    },
  ],
};

const students = [
  {
    id: "student-1",
    student_id: "STU-1",
    full_name_en: "Ahmed Hassan",
    full_name_ar: "أحمد حسن",
    name: "Ahmed Hassan",
    gender: "Male",
    dateOfBirth: "2015-01-01",
    nationality: "SA",
    gradeRequested: "Grade 1",
    submittedDate: "2026-05-14",
    created_at: "2026-05-14",
    contact: {},
    status: "Active",
    enrollment: {
      id: "enrollment-1",
      enrollmentId: "enrollment-1",
      studentId: "student-1",
      academicYear: "2026",
      grade: "Grade 1",
      section: "A",
      enrollmentDate: "2026-05-14",
      status: "Active",
    },
  },
];

describe("Reinforcement context selector components", () => {
  beforeEach(() => {
    academicMocks.fetchAcademicYears.mockReset().mockResolvedValue([
      { id: "year-1", nameEn: "2026" },
    ]);
    academicMocks.fetchTerms.mockReset().mockResolvedValue([
      { id: "term-1", nameEn: "Term 1", yearId: "year-1" },
    ]);
    academicMocks.fetchAcademicStructureTree.mockReset().mockResolvedValue(
      structureTree,
    );
    subjectMocks.fetchSubjects.mockReset().mockResolvedValue([
      { id: "subject-1", termId: "term-1", nameEn: "Math", nameAr: "رياضيات" },
    ]);
    studentMocks.fetchStudentsWithEnrollmentForContext
      .mockReset()
      .mockResolvedValue(students);
  });

  it("renders academic, structure, subject, and student selectors", async () => {
    render(
      <ReinforcementAcademicContextFilter
        value={{ academicYearId: "year-1", termId: "term-1" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Academic year")).toBeInTheDocument();
    expect(screen.getByText("Term")).toBeInTheDocument();
    expect(screen.getByText("Stage")).toBeInTheDocument();
    expect(screen.getByText("Grade")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Classroom")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();

    await waitFor(() => {
      expect(academicMocks.fetchAcademicStructureTree).toHaveBeenCalledWith({
        yearId: "year-1",
        termId: "term-1",
      });
      expect(studentMocks.fetchStudentsWithEnrollmentForContext).toHaveBeenCalledWith(
        "year-1",
        "term-1",
      );
    });
  });

  it("renders task target selector with student as the default scope", async () => {
    render(
      <ReinforcementTaskTargetSelector
        academicYearId="year-1"
        termId="term-1"
        value={[]}
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Target scope")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Student" })).toBeInTheDocument();
    expect(screen.getByText("No targets selected yet.")).toBeInTheDocument();

    await waitFor(() => {
      expect(academicMocks.fetchAcademicStructureTree).toHaveBeenCalledWith({
        yearId: "year-1",
        termId: "term-1",
      });
      expect(studentMocks.fetchStudentsWithEnrollmentForContext).toHaveBeenCalledWith(
        "year-1",
        "term-1",
      );
    });
  });

  it("prevents duplicate task targets in the selector", async () => {
    const user = userEvent.setup();

    render(
      <ReinforcementTaskTargetSelector
        academicYearId="year-1"
        termId="term-1"
        value={[
          {
            scopeType: "student",
            scopeId: "student-1",
            label: "Ahmed Hassan",
            enrollmentId: "enrollment-1",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(studentMocks.fetchStudentsWithEnrollmentForContext).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: /Select an option/i }),
    );
    await user.click(await screen.findByText("Ahmed Hassan"));
    await user.click(screen.getByRole("button", { name: /Add target/i }));

    expect(await screen.findByText("This target is already selected.")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GradesTab from "../GradesTab";
import { fetchStudentGradesSnapshot } from "@/features/grades/overview/services/gradesOverviewService";
import type { Student } from "@/features/students-guardians/students/types";

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Mock fetchStudentGradesSnapshot service
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchStudentGradesSnapshot: vi.fn(),
}));

// Mock @mui/x-charts/LineChart to simplify component rendering
vi.mock("@mui/x-charts/LineChart", () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

const mockStudent: Student = {
  id: "student-123",
  student_id: "STU-123",
  first_name_en: "John",
  last_name_en: "Doe",
  status: "active",
} as unknown as Student;

describe("GradesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders missing_term_context when academicYearId is missing", () => {
    render(<GradesTab student={mockStudent} termId="term-1" />);

    expect(screen.getByText("missing_term_context")).toBeInTheDocument();
    expect(fetchStudentGradesSnapshot).not.toHaveBeenCalled();
  });

  it("renders missing_term_context when termId is missing", () => {
    render(<GradesTab student={mockStudent} academicYearId="year-2026" />);

    expect(screen.getByText("missing_term_context")).toBeInTheDocument();
    expect(fetchStudentGradesSnapshot).not.toHaveBeenCalled();
  });

  it("fetches snapshot when academicYearId and termId are provided", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockResolvedValue({
      studentId: "student-123",
      currentAverage: 92.5,
      highestAverage: 98.0,
      lowestAverage: 85.0,
      totalAssessments: 12,
      performanceTrend: [{ label: "P1", average: 92.5 }],
      subjectRows: [
        {
          subjectId: "math",
          subjectName: "Mathematics",
          subjectNameAr: "الرياضيات",
          average: 95.0,
          lastAssessmentScore: 94.0,
          assessmentsCount: 4,
          trend: "up",
        },
      ],
    });

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    await waitFor(() => {
      expect(fetchStudentGradesSnapshot).toHaveBeenCalledWith("student-123", {
        academicYearId: "year-2026",
        termId: "term-1",
      });
    });

    expect(await screen.findByText("92.5%")).toBeInTheDocument();
  });

  it("renders no_snapshot_available error on 404 or enrollment not found", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockRejectedValue(
      new Error("Student enrollment not found (404)")
    );

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    expect(await screen.findByText("no_snapshot_available")).toBeInTheDocument();
  });

  it("renders custom error message on generic fetch error", async () => {
    vi.mocked(fetchStudentGradesSnapshot).mockRejectedValue(
      new Error("Database connection error")
    );

    render(
      <GradesTab
        student={mockStudent}
        academicYearId="year-2026"
        termId="term-1"
      />
    );

    expect(await screen.findByText("Database connection error")).toBeInTheDocument();
  });
});

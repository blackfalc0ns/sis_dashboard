import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationDetailsPage from "@/features/admissions/applications/pages/ApplicationDetailsPage";
import type {
  Application,
  ApplicationStatus,
} from "@/features/admissions/types/admissions";

const applicationServiceMocks = vi.hoisted(() => ({
  fetchApplicationById: vi.fn(),
}));

const documentServiceMocks = vi.hoisted(() => ({
  fetchApplicationDocuments: vi.fn(),
}));

const testServiceMocks = vi.hoisted(() => ({
  createPlacementTest: vi.fn(),
  fetchPlacementTests: vi.fn(),
}));

const interviewServiceMocks = vi.hoisted(() => ({
  createInterview: vi.fn(),
  fetchInterviews: vi.fn(),
}));

const decisionServiceMocks = vi.hoisted(() => ({
  createDecision: vi.fn(),
  fetchDecisions: vi.fn(),
  getDecisionFriendlyErrorMessage: vi.fn(),
}));

const enrollmentServiceMocks = vi.hoisted(() => ({
  createEnrollmentHandoffPreview: vi.fn(),
  getEnrollmentFriendlyErrorMessage: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showToast: toastMocks.showToast,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      "actions.schedule_test": "Schedule Test",
      "actions.schedule_interview": "Schedule Interview",
      "actions.make_decision": "Make Decision",
      "actions.enroll_student": "Enroll Student",
      "actions.waitlisted_no_transition":
        "This application is waitlisted. No transition action is available yet.",
      "actions.rejected_no_actions":
        "This application has been rejected. No further actions are available.",
      "header.title": "Application",
      "tabs.details": "Details",
      "tabs.guardians": "Guardians",
      "tabs.documents": "Documents",
      "tabs.tests": "Tests",
      "tabs.interviews": "Interviews",
      "tabs.timeline": "Timeline",
    })[key] ?? key,
}));

vi.mock("@/features/admissions/shared/hooks/useAdmissionsUrlQueryState", () => ({
  useAdmissionsUrlQueryState: () => ({
    values: { tab: "details" },
    setValue: vi.fn(),
  }),
}));

vi.mock("@/features/admissions/shared/StatusBadge", () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/features/admissions/shared/TabNavigation", () => ({
  default: () => <nav aria-label="Application tabs" />,
}));

vi.mock("@/features/admissions/tests/components/ScheduleTestModal", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admissions/interviews/components/ScheduleInterviewModal",
  () => ({
    default: () => null,
  }),
);

vi.mock("@/features/admissions/decisions/components/DecisionModal", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/enrollment/components/EnrollmentForm", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admissions/applications/components/tabs/DetailsTab",
  () => ({
    default: () => <section>Details content</section>,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/GuardiansTab",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/DocumentsTab",
  () => ({
    default: () => null,
  }),
);

vi.mock("@/features/admissions/applications/components/tabs/TestsTab", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admissions/applications/components/tabs/InterviewsTab",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/TimelineTab",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/admissions/applications/services/applicationsApiService",
  () => applicationServiceMocks,
);

vi.mock(
  "@/features/admissions/applications/services/applicationDocumentsApiService",
  () => documentServiceMocks,
);

vi.mock(
  "@/features/admissions/tests/services/testsApiService",
  () => testServiceMocks,
);

vi.mock(
  "@/features/admissions/interviews/services/interviewsApiService",
  () => interviewServiceMocks,
);

vi.mock(
  "@/features/admissions/decisions/services/decisionsApiService",
  () => decisionServiceMocks,
);

vi.mock(
  "@/features/admissions/enrollment/services/admissionsEnrollmentApiService",
  () => enrollmentServiceMocks,
);

function applicationWithStatus(status: ApplicationStatus): Application {
  return {
    id: "app-1",
    status,
    submittedDate: "2026-01-01T00:00:00.000Z",
    full_name_ar: "Student",
    full_name_en: "Student",
    studentName: "Student",
    gender: "N/A",
    date_of_birth: "2018-01-01",
    nationality: "N/A",
    grade_requested: "Grade 1",
    gradeRequested: "Grade 1",
    guardians: [],
    guardianName: "Guardian",
    guardianPhone: "123",
    guardianEmail: "guardian@example.com",
    documents: [],
    tests: [],
    interviews: [],
  };
}

async function renderApplicationDetails(status: ApplicationStatus) {
  applicationServiceMocks.fetchApplicationById.mockResolvedValue(
    applicationWithStatus(status),
  );

  render(<ApplicationDetailsPage applicationId="app-1" />);
  await screen.findByText("Details content");
}

describe("ApplicationDetailsPage action bar", () => {
  beforeEach(() => {
    applicationServiceMocks.fetchApplicationById.mockReset();
    documentServiceMocks.fetchApplicationDocuments.mockReset().mockResolvedValue([]);
    testServiceMocks.createPlacementTest.mockReset();
    testServiceMocks.fetchPlacementTests.mockReset().mockResolvedValue([]);
    interviewServiceMocks.createInterview.mockReset();
    interviewServiceMocks.fetchInterviews.mockReset().mockResolvedValue([]);
    decisionServiceMocks.createDecision.mockReset();
    decisionServiceMocks.fetchDecisions.mockReset().mockResolvedValue([]);
    decisionServiceMocks.getDecisionFriendlyErrorMessage.mockReset();
    enrollmentServiceMocks.createEnrollmentHandoffPreview.mockReset();
    enrollmentServiceMocks.getEnrollmentFriendlyErrorMessage.mockReset();
    toastMocks.showToast.mockReset();
  });

  it("shows workflow actions for submitted applications", async () => {
    await renderApplicationDetails("submitted");

    expect(screen.getByRole("button", { name: "Schedule Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schedule Interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make Decision" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
  });

  it("shows schedule actions but hides decision for documents pending applications", async () => {
    await renderApplicationDetails("documents_pending");

    expect(screen.getByRole("button", { name: "Schedule Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schedule Interview" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
  });

  it("hides workflow actions and explains waitlisted applications", async () => {
    await renderApplicationDetails("waitlisted");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This application is waitlisted. No transition action is available yet.",
      ),
    ).toBeInTheDocument();
  });

  it("hides workflow actions and explains rejected applications", async () => {
    await renderApplicationDetails("rejected");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This application has been rejected. No further actions are available.",
      ),
    ).toBeInTheDocument();
  });

  it("shows only enrollment for accepted applications", async () => {
    await renderApplicationDetails("accepted");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enroll Student" })).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReinforcementProgressTab from "../ReinforcementProgressTab";
import { getStudentReinforcementProgress } from "@/features/reinforcement/services/reinforcementOverviewService";

const permissionState = vi.hoisted(() => ({ canView: true }));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const translate = (key: string) => key;
    translate.has = () => false;
    return translate;
  },
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (key: string) => key === "reinforcement.overview.view" && permissionState.canView,
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/reinforcement/services/reinforcementOverviewService", () => ({
  getStudentReinforcementProgress: vi.fn(),
}));

const response = {
  studentId: "student-1",
  student: { name: "Ali Dahshan" },
  assignments: { total: 1, completed: 1 },
  tasks: [{ taskId: "task-1", status: "completed", task: { id: "task-1", titleEn: "Mission One" } }],
  xp: { totalXp: 10, recentLedgerEntries: [] },
};

describe("ReinforcementProgressTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.canView = true;
    vi.mocked(getStudentReinforcementProgress).mockResolvedValue(response);
  });

  it("loads the student progress for the active academic context", async () => {
    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("Ali Dahshan")).toBeInTheDocument();
    expect(screen.getByText("Mission One")).toBeInTheDocument();
    expect(getStudentReinforcementProgress).toHaveBeenCalledWith("student-1", {
      academicYearId: "year-1",
      termId: "term-1",
    });
  });

  it("does not request data without view permission", async () => {
    permissionState.canView = false;
    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("common.accessDenied")).toBeInTheDocument();
    expect(getStudentReinforcementProgress).not.toHaveBeenCalled();
  });

  it("retries a failed request", async () => {
    const user = userEvent.setup();
    vi.mocked(getStudentReinforcementProgress)
      .mockRejectedValueOnce(new Error("Backend unavailable"))
      .mockResolvedValueOnce(response);

    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Backend unavailable");
    await user.click(screen.getByRole("button", { name: "actions.retry" }));

    await waitFor(() => expect(getStudentReinforcementProgress).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Ali Dahshan")).toBeInTheDocument();
  });

  it("shows an empty state when the endpoint returns no progress record", async () => {
    vi.mocked(getStudentReinforcementProgress).mockResolvedValue(null as never);

    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("emptyStates.studentProgress")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeworkAssignmentBuilderPage from "../HomeworkAssignmentBuilderPage";
import {
  fetchHomeworkAssignment,
  listHomeworkAttachments,
  listHomeworkQuestions,
  updateHomeworkAssignment,
} from "../../services/homeworkService";

const showError = vi.fn();
const showSuccess = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@mui/material", () => ({
  useTheme: () => ({ breakpoints: { down: () => "xl" } }),
  useMediaQuery: () => false,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ termStatus: "open" }),
}));

vi.mock("@/features/academics/curriculum/components/DesktopLayout", () => ({
  default: ({ onUpdateAssignment }: {
    onUpdateAssignment: (updates: Record<string, unknown>) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onUpdateAssignment({ titleAr: "", titleEn: "" })}
      >
        clear-title
      </button>
      <button
        type="button"
        onClick={() =>
          onUpdateAssignment({
            titleAr: "  Original  ",
            titleEn: "  Original  ",
            descriptionAr: "  Changed  ",
            descriptionEn: "  Changed  ",
            maxScore: null,
          })
        }
      >
        valid-nullable-edit
      </button>
    </div>
  ),
}));

vi.mock("@/features/academics/curriculum/components/MobileLayout", () => ({
  default: () => null,
}));

vi.mock("@/features/academics/homework/components/HomeworkGradeSyncPanel", () => ({
  default: () => null,
}));

vi.mock("@/features/academics/homework/components/HomeworkSubmissionReviewPanel", () => ({
  default: () => null,
}));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: () => null,
}));

vi.mock("../../services/homeworkService", () => ({
  fetchHomeworkAssignment: vi.fn(),
  listHomeworkQuestions: vi.fn(),
  listHomeworkAttachments: vi.fn(),
  updateHomeworkAssignment: vi.fn(),
  createHomeworkQuestion: vi.fn(),
  updateHomeworkQuestion: vi.fn(),
  deleteHomeworkQuestion: vi.fn(),
  reorderHomeworkQuestion: vi.fn(),
  createHomeworkAttachment: vi.fn(),
  deleteHomeworkAttachment: vi.fn(),
  publishHomeworkAssignment: vi.fn(),
  closeHomeworkAssignment: vi.fn(),
  cancelHomeworkAssignment: vi.fn(),
}));

vi.mock("../../services/homeworkFilesService", () => ({
  uploadHomeworkFile: vi.fn(),
}));

function homework() {
  return {
    id: "homework-1",
    title: "Original",
    description: "Initial",
    mode: "homework",
    status: "draft" as const,
    targetMode: "classroom",
    dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    publishAt: null,
    totalMarks: null,
    isGraded: false,
    questionCount: 0,
    attachmentCount: 0,
  };
}

describe("HomeworkAssignmentBuilderPage assignment contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchHomeworkAssignment).mockResolvedValue(homework());
    vi.mocked(listHomeworkQuestions).mockResolvedValue([]);
    vi.mocked(listHomeworkAttachments).mockResolvedValue([]);
    vi.mocked(updateHomeworkAssignment).mockResolvedValue(homework());
  });

  it("blocks invalid edits and preserves nullable marks in a normalized update", async () => {
    render(<HomeworkAssignmentBuilderPage homeworkId="homework-1" />);
    await screen.findByText("clear-title");

    fireEvent.click(screen.getByText("clear-title"));
    const save = screen.getByRole("button", { name: "actions.save" });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    expect(updateHomeworkAssignment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("valid-nullable-edit"));
    fireEvent.click(save);

    await waitFor(() => expect(updateHomeworkAssignment).toHaveBeenCalledTimes(1));
    expect(updateHomeworkAssignment).toHaveBeenCalledWith("homework-1", {
      title: "Original",
      description: "Changed",
      dueAt: expect.any(String),
      totalMarks: null,
      estimatedMinutes: undefined,
    });
  });
});

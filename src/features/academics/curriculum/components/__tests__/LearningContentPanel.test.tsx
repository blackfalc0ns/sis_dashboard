import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  createLessonContent,
  listLessonContent,
} from "../../services/curriculumService";
import LearningContentPanel from "../LearningContentPanel";

const translate = (key: string) => key;

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("@mui/material", () => ({
  Drawer: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  IconButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => "" } }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("../../services/curriculumService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/curriculumService")>();
  return {
    ...actual,
    createLessonContent: vi.fn(),
    deleteLessonContent: vi.fn(),
    listLessonContent: vi.fn(),
    reorderLessonContent: vi.fn(),
    updateLessonContent: vi.fn(),
  };
});

vi.mock("../../services/filesService", () => ({
  downloadFile: vi.fn(),
  uploadFile: vi.fn(),
}));

describe("LearningContentPanel", () => {
  it("shows backend field errors inline and preserves content values", async () => {
    const user = userEvent.setup();
    vi.mocked(listLessonContent).mockResolvedValue([]);
    vi.mocked(createLessonContent).mockRejectedValueOnce(
      new ApiError("Validation failed", 422, "validation.failed", {
        title: ["Content title already exists"],
        bodyText: ["Content body is invalid"],
        sortOrder: ["Content order is invalid"],
      }),
    );

    render(
      <LearningContentPanel
        curriculumId="curriculum-1"
        unitId="unit-1"
        lessonId="lesson-1"
        isReadOnly={false}
        open
        onClose={vi.fn()}
      />,
    );

    const titleInput = screen.getByLabelText(/item_title/);
    const bodyInput = screen.getByLabelText(/body_text/);
    await user.type(titleInput, "Introduction");
    await user.type(bodyInput, "Read this lesson");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("Content title already exists")).toBeInTheDocument();
    expect(screen.getByText("Content body is invalid")).toBeInTheDocument();
    expect(screen.getByText("Content order is invalid")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Introduction")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Read this lesson")).toBeInTheDocument();

    await user.type(titleInput, " revised");
    expect(screen.queryByText("Content title already exists")).not.toBeInTheDocument();
    expect(screen.getByText("Content body is invalid")).toBeInTheDocument();
  });
});

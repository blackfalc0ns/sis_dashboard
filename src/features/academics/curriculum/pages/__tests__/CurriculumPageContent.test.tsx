import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CurriculumPageContent from "../CurriculumPageContent";

const routerMocks = {
  push: vi.fn(),
  replace: vi.fn(),
};
const translate = (key: string) => key;
const guardMocks = vi.hoisted(() => ({
  params: null as { confirmDiscard: () => Promise<boolean> } | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();
  return {
    ...actual,
    useMediaQuery: () => false,
    useTheme: () => ({ breakpoints: { down: () => "" } }),
  };
});

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "",
    termId: "",
    termStatus: "active",
    selectedTerm: null,
    isInitializing: false,
  }),
}));

vi.mock("@/features/academics/hooks/useGuardedAcademicContextChange", () => ({
  useGuardedAcademicContextChange: vi.fn(
    (params: { confirmDiscard: () => Promise<boolean> }) => {
      guardMocks.params = params;
    },
  ),
}));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: ({
    cancelLabel,
    confirmLabel,
    isOpen,
    onClose,
    onConfirm,
    title,
  }: {
    cancelLabel: string;
    confirmLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div>
        <p>{title}</p>
        <button type="button" onClick={onClose}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null,
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({
    fetchStructureTree: vi.fn(),
  }),
);

vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: vi.fn(),
}));

vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({
  archiveCurriculum: vi.fn(),
  activateCurriculum: vi.fn(),
  deleteCurriculum: vi.fn(),
  fetchCurriculumForScope: vi.fn(),
  calculateTermWeeks: vi.fn(() => 0),
}));

vi.mock("@/features/academics/curriculum/services/curriculumErrors", () => ({
  curriculumUiError: () => ({ message: "error" }),
}));

vi.mock("../components/CurriculumOutline", () => ({
  default: () => <div data-testid="curriculum-outline" />,
}));

vi.mock("../components/CurriculumEditor", () => ({
  default: () => <div data-testid="curriculum-editor" />,
}));

vi.mock("../components/CurriculumActionsMenu", () => ({
  default: () => <button type="button">actions</button>,
}));

vi.mock("../components/CreateCurriculumDialog", () => ({
  default: () => <div data-testid="create-curriculum-dialog" />,
}));

vi.mock(
  "@/features/academics/shared/components/export/AcademicsGlobalExportModal",
  () => ({
    default: () => <div data-testid="export-modal" />,
  }),
);

vi.mock("@/features/academics/utils/exportAdapter", () => ({
  exportAcademicsData: vi.fn(),
  formatExportDate: () => "2026-07-02",
  generateExportFilename: () => "curriculum.csv",
}));

vi.mock("@/components/ui/loaders/PartialLoader", () => ({
  default: () => <div data-testid="partial-loader" />,
}));

describe("CurriculumPageContent", () => {
  beforeEach(() => {
    routerMocks.push.mockClear();
    routerMocks.replace.mockClear();
    guardMocks.params = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("settles without a render loop while the academic context has no year or term", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<CurriculumPageContent />);

    await waitFor(() => {
      expect(screen.queryByTestId("partial-loader")).not.toBeInTheDocument();
    });

    expect(
      consoleError.mock.calls.some(([message]) =>
        String(message).includes("Maximum update depth exceeded"),
      ),
    ).toBe(false);
    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("resolves an unsaved-change decision as cancelled when the dialog closes", async () => {
    const user = userEvent.setup();
    render(<CurriculumPageContent />);
    await waitFor(() => expect(guardMocks.params).not.toBeNull());

    let decision!: Promise<boolean>;
    act(() => {
      decision = guardMocks.params!.confirmDiscard();
    });
    expect(await screen.findByText("unsaved_changes.title")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "unsaved_changes.cancel" }),
    );

    await expect(decision).resolves.toBe(false);
  });

  it("resolves an unsaved-change decision as confirmed", async () => {
    const user = userEvent.setup();
    render(<CurriculumPageContent />);
    await waitFor(() => expect(guardMocks.params).not.toBeNull());

    let decision!: Promise<boolean>;
    act(() => {
      decision = guardMocks.params!.confirmDiscard();
    });
    await user.click(
      await screen.findByRole("button", { name: "unsaved_changes.discard" }),
    );

    await expect(decision).resolves.toBe(true);
  });
});

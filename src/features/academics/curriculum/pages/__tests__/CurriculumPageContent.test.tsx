import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CurriculumPageContent from "../CurriculumPageContent";

const routerMocks = {
  push: vi.fn(),
  replace: vi.fn(),
};
const translate = (key: string) => key;

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

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
  useGuardedAcademicContextChange: vi.fn(),
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
});

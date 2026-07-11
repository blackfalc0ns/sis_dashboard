import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchGradeRules: vi.fn(),
  fetchEffectiveGradeRule: vi.fn(),
  fetchGradesFiltersData: vi.fn(),
  push: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  usePathname: () => "/en/grades/rules",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/grades/hooks/GradesYearTermLayoutContext", () => ({
  useGradesYearTermLayoutContext: () => ({ academicYearId: "year-1", termId: "term-1", isInitializing: false }),
}));
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => ({ showError: vi.fn() }) }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => ({ hasPermission: mocks.hasPermission }) }));
vi.mock("../../services/gradesRulesService", () => ({
  fetchGradeRules: mocks.fetchGradeRules,
  fetchEffectiveGradeRule: mocks.fetchEffectiveGradeRule,
}));
vi.mock("@/features/grades/gradebook/services/gradesGradebookService", () => ({
  fetchGradesFiltersData: mocks.fetchGradesFiltersData,
}));

import GradesRulesListPage from "../GradesRulesListPage";

describe("GradesRulesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasPermission.mockReturnValue(true);
    mocks.fetchEffectiveGradeRule.mockResolvedValue({ source: "GRADE" });
  });

  it("shows backend rules in the shared table and opens the selected editor with year and term context", async () => {
    mocks.fetchGradeRules.mockResolvedValue([{ id: "rule-1", scopeType: "grade", passMark: 70, rounding: "DECIMAL_2" }]);
    mocks.fetchGradesFiltersData.mockResolvedValue({ scopeEntities: { school: [], stage: [], grade: [], section: [], classroom: [] } });
    render(<GradesRulesListPage />);

    await userEvent.click(await screen.findByText("70%"));

    expect(mocks.push).toHaveBeenCalledWith("/en/grades/rules/rule-1?year=year-1&term=term-1");
  });

  it("reloads the table with the selected backend scope filters and identifies the effective source", async () => {
    mocks.fetchGradeRules.mockResolvedValue([]);
    mocks.fetchGradesFiltersData.mockResolvedValue({
      scopeEntities: {
        school: [],
        stage: [],
        grade: [{ id: "grade-1", nameEn: "Grade 1", nameAr: "الصف الأول", scopeType: "grade" }],
        section: [],
        classroom: [],
      },
    });
    render(<GradesRulesListPage />);

    await userEvent.click(await screen.findByLabelText("filters.scopeType"));
    await userEvent.click(screen.getByRole("button", { name: "filters.scopeTypes.grade" }));
    await userEvent.click(await screen.findByLabelText("filters.scope"));
    await userEvent.click(screen.getByRole("button", { name: "Grade 1" }));

    await waitFor(() => expect(mocks.fetchGradeRules).toHaveBeenLastCalledWith(
      { academicYearId: "year-1", termId: "term-1", scopeType: "grade", scopeId: "grade-1", gradeId: "grade-1" },
    ));
    expect(await screen.findByText("sources.GRADE")).toBeInTheDocument();
  });

  it("keeps a visible loading status until the rules request resolves", () => {
    mocks.fetchGradeRules.mockReturnValue(new Promise(() => undefined));
    mocks.fetchGradesFiltersData.mockReturnValue(new Promise(() => undefined));

    render(<GradesRulesListPage />);

    expect(screen.getByRole("status", { name: "loading" })).toBeInTheDocument();
  });

  it("explains an empty list", async () => {
    mocks.fetchGradeRules.mockResolvedValue([]);
    mocks.fetchGradesFiltersData.mockResolvedValue({ scopeEntities: { school: [], stage: [], grade: [], section: [], classroom: [] } });
    render(<GradesRulesListPage />);

    expect(await screen.findByText("emptyTitle")).toBeInTheDocument();
    expect(screen.getByText("emptyDescription")).toBeInTheDocument();
  });

  it("offers a retry after a rules request fails", async () => {
    mocks.fetchGradeRules.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    mocks.fetchGradesFiltersData.mockResolvedValue({ scopeEntities: { school: [], stage: [], grade: [], section: [], classroom: [] } });
    const user = userEvent.setup();
    render(<GradesRulesListPage />);

    await user.click(await screen.findByRole("button", { name: "retry" }));

    await waitFor(() => expect(mocks.fetchGradeRules).toHaveBeenCalledTimes(2));
  });

  it("hides management actions and does not open a rule without manage permission", async () => {
    mocks.hasPermission.mockReturnValue(false);
    mocks.fetchGradeRules.mockResolvedValue([{ id: "rule-1", scopeType: "grade", passMark: 70, rounding: "DECIMAL_2" }]);
    mocks.fetchGradesFiltersData.mockResolvedValue({ scopeEntities: { school: [], stage: [], grade: [], section: [], classroom: [] } });
    render(<GradesRulesListPage />);

    expect(await screen.findByText("70%")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "form.createTitle" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("70%"));
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

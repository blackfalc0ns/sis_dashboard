import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GradesRulesListPage from "../GradesRulesListPage";
import { fetchGradeRules } from "../../services/gradesRulesService";

const push = vi.fn();
const translate = (key: string) => key;
const showError = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/grades/hooks/GradesYearTermLayoutContext", () => ({
  useGradesYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    isInitializing: false,
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess: vi.fn() }),
}));

vi.mock("../../services/gradesRulesService", () => ({
  fetchGradeRules: vi.fn(),
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({ data, onRowClick }: { data: Array<{ id: string; passMark: number }>; onRowClick: (row: { id: string; passMark: number }) => void }) => (
    <table>
      <tbody>{data.map((row) => <tr key={row.id} onClick={() => onRowClick(row)}><td>{row.passMark}</td></tr>)}</tbody>
    </table>
  ),
}));

describe("GradesRulesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads rules once and opens the selected row", async () => {
    vi.mocked(fetchGradeRules).mockResolvedValue([{
      id: "rule-1", academicYearId: "year-1", termId: "term-1", scopeType: "grade", scopeId: "grade-1", gradeId: "grade-1", gradingScale: "PERCENTAGE", passMark: 70, rounding: "DECIMAL_2",
    }]);

    render(<GradesRulesListPage />);

    expect(await screen.findByText("70")).toBeVisible();
    expect(fetchGradeRules).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("70"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/en/grades/rules/rule-1?year=year-1&term=term-1"));
  });
});

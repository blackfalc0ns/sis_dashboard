import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicContextSetupStep } from "../components/steps/AcademicContextSetupStep";

const dialogMocks = vi.hoisted(() => ({
  yearDialog: vi.fn(),
  termDialog: vi.fn(),
}));

vi.mock("@/features/academics/components/dialogs/YearTermDialogs", () => ({
  YearDialog: (props: unknown) => {
    dialogMocks.yearDialog(props);
    return (props as { isOpen: boolean }).isOpen ? <div>Year dialog open</div> : null;
  },
  TermDialog: (props: unknown) => {
    dialogMocks.termDialog(props);
    return (props as { isOpen: boolean }).isOpen ? <div>Term dialog open</div> : null;
  },
}));

const year = {
  id: "year-1",
  name: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

const term = {
  id: "term-1",
  name: "Term 1",
  yearId: year.id,
  status: "open" as const,
  startDate: "2026-09-01",
  endDate: "2027-01-15",
};

const copy = {
  summary: "Create the academic year and terms.",
  savedData: "Saved setup data",
  edit: "Edit",
  cancel: "Cancel",
  yearsCount: (count: number) => `${count} years`,
  termsCount: (count: number) => `${count} terms`,
  selectedYear: (name: string) => `Selected year: ${name}`,
  createYear: "Create academic year",
  createTerm: "Create term",
};

describe("AcademicContextSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows saved academic context data before editing", async () => {
    const user = userEvent.setup();

    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [year], termsByYear: { [year.id]: [term] } }}
        selectedYear={year}
        refreshStep={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
    expect(screen.getByText(copy.yearsCount(1))).toBeVisible();
    expect(screen.getByText(copy.termsCount(1))).toBeVisible();
    expect(screen.getByText(copy.selectedYear(year.name))).toBeVisible();

    await user.click(screen.getByRole("button", { name: copy.edit }));
    expect(screen.getByRole("button", { name: copy.createTerm })).toBeVisible();

    await user.click(screen.getByRole("button", { name: copy.cancel }));
    expect(screen.getByRole("heading", { name: copy.savedData })).toBeVisible();
  });

  it("opens YearDialog with existingYears when no academic year exists", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();

    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [], termsByYear: {} }}
        selectedYear={null}
        refreshStep={refreshStep}
      />,
    );

    expect(screen.queryByRole("heading", { name: copy.savedData })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create academic year" }));

    expect(screen.getByText("Year dialog open")).toBeVisible();
    expect(dialogMocks.yearDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        existingYears: [],
        editYear: null,
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("opens TermDialog with the selected year and its existing terms", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();

    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [year], termsByYear: { [year.id]: [term] } }}
        selectedYear={year}
        refreshStep={refreshStep}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.edit }));
    await user.click(screen.getByRole("button", { name: "Create term" }));

    expect(screen.getByText("Term dialog open")).toBeVisible();
    expect(dialogMocks.termDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        academicYear: year,
        existingTerms: [term],
        editTerm: null,
        onSuccess: expect.any(Function),
      }),
    );
  });
});

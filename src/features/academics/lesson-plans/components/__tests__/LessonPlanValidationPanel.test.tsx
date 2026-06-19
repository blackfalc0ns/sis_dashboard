import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LessonPlanValidationPanel from "../LessonPlanValidationPanel";

describe("lesson plan validation panel", () => {
  it("renders translated summary and collapsible backend issues", async () => {
    const user = userEvent.setup();
    render(
      <LessonPlanValidationPanel
        validation={{
          termId: "term-1",
          academicYearId: "year-1",
          summary: {
            lessonPlansChecked: 2,
            itemsChecked: 8,
            missingPlannedLessons: 1,
            holidayItems: 1,
            outsideTermItems: 0,
            duplicateLessons: 1,
          },
          issues: [
            {
              severity: "warning",
              code: "holiday_item",
              message: "Lesson falls on a holiday",
              itemId: "item-1",
            },
          ],
        }}
      />,
    );
    expect(screen.queryByText(/Lesson falls on a holiday/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /showIssues/i }));
    expect(screen.getByText(/Lesson falls on a holiday/)).toBeInTheDocument();
    expect(screen.queryByText("duplicateLessons")).not.toBeInTheDocument();
  });
});

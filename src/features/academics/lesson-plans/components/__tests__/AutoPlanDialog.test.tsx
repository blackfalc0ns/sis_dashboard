import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import AutoPlanDialog from "../AutoPlanDialog";

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

describe("AutoPlanDialog missing-data actions", () => {
  it.each([
    [
      "academics.lesson_plan.auto_plan_no_slots",
      "ctas.timetable",
      "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ],
    [
      "academics.lesson_plan.auto_plan_no_curriculum",
      "ctas.curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&grade=grade-1&subject=subject-1",
    ],
  ] as const)(
    "offers a scoped resolution for %s",
    async (code, label, expectedHref) => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <AutoPlanDialog
          isOpen
          termStartDate="2026-09-01"
          termEndDate="2026-12-31"
          onClose={vi.fn()}
          onPreview={vi.fn().mockRejectedValue(new ApiError("blocked", 422, code))}
          onApply={vi.fn()}
          showError={vi.fn()}
          readiness={{ canAutoPlan: true, blockingReasons: [], warnings: [] }}
          blockedMessage="blocked"
          hasVisibleLessons
          locale="en"
          scope={scope}
          onNavigate={onNavigate}
        />,
      );

      await user.click(screen.getByRole("button", { name: "actions.preview" }));
      const resolutionButton = await screen.findByRole("button", {
        name: label,
      });
      await user.click(resolutionButton);

      expect(onNavigate).toHaveBeenCalledWith(expectedHref);
    },
  );
});

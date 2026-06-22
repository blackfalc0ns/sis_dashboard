import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssignmentSettingsPanel from "../AssignmentSettingsPanel";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("AssignmentSettingsPanel", () => {
  it("uses single title and description controls for homework", () => {
    const onUpdate = vi.fn();
    render(
      <AssignmentSettingsPanel
        assignment={{
          id: "homework-1",
          lessonId: "homework",
          titleAr: "Homework title",
          titleEn: "Homework title",
          descriptionAr: "Homework description",
          descriptionEn: "Homework description",
          maxScore: 10,
        }}
        pointsSummary={{ maxScore: 10, totalPoints: 10, difference: 0, isMatch: true }}
        validationErrors={{}}
        isReadOnly={false}
        detailsInputMode="single"
        onUpdate={onUpdate}
        onAutoDistributePoints={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("assignment_title"), {
      target: { value: "Updated title" },
    });
    fireEvent.change(screen.getByPlaceholderText("description"), {
      target: { value: "Updated description" },
    });

    expect(onUpdate).toHaveBeenNthCalledWith(1, {
      titleAr: "Updated title",
      titleEn: "Updated title",
    });
    expect(onUpdate).toHaveBeenNthCalledWith(2, {
      descriptionAr: "Updated description",
      descriptionEn: "Updated description",
    });
  });
});

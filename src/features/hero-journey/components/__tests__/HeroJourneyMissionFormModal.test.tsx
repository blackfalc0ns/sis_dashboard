import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HeroJourneyMission } from "../../types";
import HeroJourneyMissionFormModal from "../HeroJourneyMissionFormModal";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations:
    (namespace: string) =>
    (key: string): string =>
      `${namespace}.${key}`,
}));

const STAGE_ID = "33333333-3333-4333-8333-333333333333";
const GRADE_ID = "66666666-6666-4666-8666-666666666666";
const SUBJECT_ID = "44444444-4444-4444-8444-444444444444";
const ASSESSMENT_ID = "55555555-5555-4555-8555-555555555555";

const missionFixture = (
  patch: Partial<HeroJourneyMission> = {},
): HeroJourneyMission => ({
  id: "mission-1",
  stageId: STAGE_ID,
  titleEn: "Mission",
  titleAr: "مهمة",
  briefEn: "Brief",
  briefAr: "وصف",
  stageNameEn: "Stage",
  stageNameAr: "المرحلة",
  requiredLevel: 2,
  rewardXp: 20,
  linkedLessonId: "",
  linkedLessonTitleEn: "",
  linkedLessonTitleAr: "",
  linkedQuizId: "",
  linkedQuizTitleEn: "",
  linkedQuizTitleAr: "",
  status: "draft",
  objectives: [
    {
      id: "objective-1",
      type: "manual",
      titleEn: "Objective",
      subtitleEn: "Subtitle",
      subtitleAr: "العنوان الفرعي",
      linkedLessonRef: "lesson-1",
      linkedAssessmentId: ASSESSMENT_ID,
      sortOrder: 1,
      isRequired: true,
      metadata: { source: "existing" },
    },
  ],
  studentsStarted: 0,
  studentsCompleted: 0,
  updatedAt: "2026-07-13T00:00:00.000Z",
  ...patch,
});

function renderMission(
  mission: HeroJourneyMission | null,
  onSubmit = vi.fn(),
) {
  const result = render(
    <HeroJourneyMissionFormModal
      isOpen
      mission={mission}
      badges={[]}
      academicYearLabel="2026/2027"
      termLabel="Term 1"
      stageOptions={[{ value: STAGE_ID, label: "Stage" }]}
      gradeOptions={[{ value: GRADE_ID, label: "Grade" }]}
      subjectOptions={[{ value: SUBJECT_ID, label: "Subject" }]}
      assessmentOptions={[{ value: ASSESSMENT_ID, label: "Assessment" }]}
      onLoadLessons={vi.fn().mockResolvedValue([
        { value: "lesson-1", label: "Lesson", subjectId: SUBJECT_ID },
      ])}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );

  return { ...result, onSubmit };
}

describe("HeroJourneyMissionFormModal", () => {
  it("disables published-protected fields while keeping copy editable", () => {
    renderMission(missionFixture({ status: "published" }));

    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.titleEn"),
    ).not.toBeDisabled();
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.briefEn"),
    ).not.toBeDisabled();
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.requiredLevel"),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.rewardXp"),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.actions.addObjective",
      }),
    ).toBeDisabled();

    const objective = within(screen.getByTestId("mission-objective-card"));
    expect(
      objective.getByLabelText("heroJourney.missionForm.labels.objectiveType"),
    ).toBeDisabled();
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveSubtitleEn",
      ),
    ).toBeDisabled();
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveLessonRef",
      ),
    ).toBeDisabled();
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveAssessment",
      ),
    ).toBeDisabled();
    expect(
      objective.getByLabelText("heroJourney.missionForm.labels.objectiveOrder"),
    ).toBeDisabled();
    expect(
      objective.getByRole("checkbox", {
        name: "heroJourney.missionForm.labels.objectiveRequired",
      }),
    ).toBeDisabled();
  });

  it("keeps Grade and Subject while removing unrelated scope controls", () => {
    renderMission(null);

    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.grade"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.subject"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("heroJourney.missionForm.labels.section"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("heroJourney.missionForm.labels.classroom"),
    ).not.toBeInTheDocument();
  });

  it("renders and submits the complete objective editor", () => {
    const { onSubmit } = renderMission(missionFixture());
    const objective = within(screen.getByTestId("mission-objective-card"));

    expect(
      objective.getByLabelText("heroJourney.missionForm.labels.objectiveType"),
    ).toBeInTheDocument();
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveSubtitleEn",
      ),
    ).toHaveValue("Subtitle");
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveSubtitleAr",
      ),
    ).toHaveValue("العنوان الفرعي");
    expect(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveLessonRef",
      ),
    ).toHaveValue("lesson-1");
    expect(
      objective.getByRole("checkbox", {
        name: "heroJourney.missionForm.labels.objectiveRequired",
      }),
    ).toBeChecked();

    fireEvent.click(
      objective.getByLabelText("heroJourney.missionForm.labels.objectiveType"),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.objectiveTypes.quiz",
      }),
    );
    fireEvent.change(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveSubtitleEn",
      ),
      { target: { value: "Updated subtitle" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        objectives: [
          expect.objectContaining({
            type: "quiz",
            subtitleEn: "Updated subtitle",
            metadata: { source: "existing" },
          }),
        ],
      }),
      expect.any(Set),
    );
  });

  it("allows clearing an objective assessment explicitly", () => {
    const { onSubmit } = renderMission(missionFixture());
    const objective = within(screen.getByTestId("mission-objective-card"));

    fireEvent.click(
      objective.getByLabelText(
        "heroJourney.missionForm.labels.objectiveAssessment",
      ),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.options.noAssessment",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        objectives: [expect.objectContaining({ linkedAssessmentId: null })],
      }),
      expect.any(Set),
    );
  });

  it("leaves backend-defaulted numeric fields empty during create", () => {
    renderMission(null);

    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.requiredLevel"),
    ).toHaveValue(null);
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.rewardXp"),
    ).toHaveValue(null);
    expect(
      screen.getByLabelText("heroJourney.missionForm.labels.objectiveOrder"),
    ).toHaveValue(null);
  });

  it("allows draft updates to remove their final objective", () => {
    renderMission(missionFixture());

    expect(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.actions.removeObjective",
      }),
    ).not.toBeDisabled();
  });

  it("keeps one objective during create", () => {
    renderMission(null);

    expect(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.actions.removeObjective",
      }),
    ).toBeDisabled();
  });

  it("submits only user-modified fields as dirty during update", () => {
    const { onSubmit } = renderMission(missionFixture());

    fireEvent.change(
      screen.getByLabelText("heroJourney.missionForm.labels.titleEn"),
      { target: { value: "Renamed mission" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ titleEn: "Renamed mission" }),
      new Set(["titleEn"]),
    );
  });

  it("submits an empty objective list when a draft's final objective is removed", () => {
    const { onSubmit } = renderMission(missionFixture());

    fireEvent.click(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.actions.removeObjective",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ objectives: [] }),
      new Set(["objectives"]),
    );
  });

  it("clears a stale mission lesson when Subject changes", () => {
    const { onSubmit } = renderMission(
      missionFixture({
        subjectId: SUBJECT_ID,
        linkedLessonRef: "lesson-1",
      }),
    );

    fireEvent.click(
      screen.getByLabelText("heroJourney.missionForm.labels.subject"),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "heroJourney.missionForm.placeholders.noSubject",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ linkedLessonRef: null }),
      expect.any(Set),
    );
  });
});

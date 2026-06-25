"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { HeroJourneyBadge, HeroJourneyMission } from "../types";
import type {
  HeroJourneyMissionObjectivePayload,
  HeroJourneyMissionPayload,
} from "../services/heroJourneyService";

type RelatedSelectOption = SelectOption & {
  stageId?: string;
  gradeId?: string;
  gradeIds?: string[];
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  scopeType?: string;
  scopeId?: string;
};

type HeroJourneyMissionFormPayload = Omit<
  HeroJourneyMissionPayload,
  "academicYearId" | "yearId" | "termId"
>;

interface HeroJourneyMissionFormModalProps {
  isOpen: boolean;
  mission: HeroJourneyMission | null;
  badges: HeroJourneyBadge[];
  academicYearLabel: string;
  termLabel: string;
  stageOptions: RelatedSelectOption[];
  gradeOptions: RelatedSelectOption[];
  sectionOptions: RelatedSelectOption[];
  classroomOptions: RelatedSelectOption[];
  subjectOptions: RelatedSelectOption[];
  assessmentOptions: RelatedSelectOption[];
  optionsLoading?: boolean;
  optionsError?: string | null;
  onLoadLessons: (
    gradeId: string,
    subjectId: string,
  ) => Promise<RelatedSelectOption[]>;
  onRefreshOptions?: () => void;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: HeroJourneyMissionFormPayload) => Promise<void> | void;
}

const blankObjective = (): HeroJourneyMissionObjectivePayload => ({
  type: "task",
  titleEn: "",
  titleAr: "",
  sortOrder: 1,
  isRequired: true,
});

const missionObjectivesForForm = (
  mission: HeroJourneyMission | null,
): HeroJourneyMissionObjectivePayload[] => {
  const objectives = mission?.objectives || [];
  if (objectives.length === 0) {
    return [blankObjective()];
  }

  return objectives.map((objective, index) => ({
    type: objective.type || "task",
    titleEn: objective.titleEn || "",
    titleAr: objective.titleAr || "",
    subtitleEn: objective.subtitleEn,
    subtitleAr: objective.subtitleAr,
    linkedAssessmentId: objective.linkedAssessmentId,
    linkedLessonRef: objective.linkedLessonRef,
    sortOrder: objective.sortOrder ?? index + 1,
    isRequired: objective.isRequired ?? true,
    metadata: objective.metadata,
  }));
};

const withSelectedOption = (
  options: RelatedSelectOption[],
  value: string,
  label: string,
): RelatedSelectOption[] => {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }

  return [{ value, label }, ...options];
};

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function HeroJourneyMissionFormModal({
  isOpen,
  mission,
  badges,
  academicYearLabel,
  termLabel,
  stageOptions,
  gradeOptions,
  sectionOptions,
  classroomOptions,
  subjectOptions,
  assessmentOptions,
  optionsLoading = false,
  optionsError,
  onLoadLessons,
  onRefreshOptions,
  loading = false,
  onClose,
  onSubmit,
}: HeroJourneyMissionFormModalProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("heroJourney.missionForm");
  const missionMetadata = mission?.metadata as
    | {
        academicScope?: {
          gradeId?: string;
          sectionId?: string;
          classroomId?: string;
          gradeLabel?: string;
          sectionLabel?: string;
          classroomLabel?: string;
        };
      }
    | undefined;
  const [stageId, setStageId] = useState(mission?.stageId || "");
  const [gradeId, setGradeId] = useState(
    mission?.gradeId || missionMetadata?.academicScope?.gradeId || "",
  );
  const [sectionId, setSectionId] = useState(
    mission?.sectionId || missionMetadata?.academicScope?.sectionId || "",
  );
  const [classroomId, setClassroomId] = useState(
    mission?.classroomId || missionMetadata?.academicScope?.classroomId || "",
  );
  const [subjectId, setSubjectId] = useState(mission?.subjectId || "");
  const [linkedAssessmentId, setLinkedAssessmentId] = useState(
    mission?.linkedAssessmentId || mission?.linkedQuizId || "",
  );
  const [linkedLessonRef, setLinkedLessonRef] = useState(
    mission?.linkedLessonRef || mission?.linkedLessonId || "",
  );
  const [titleEn, setTitleEn] = useState(mission?.titleEn || "");
  const [titleAr, setTitleAr] = useState(mission?.titleAr || "");
  const [briefEn, setBriefEn] = useState(mission?.briefEn || "");
  const [briefAr, setBriefAr] = useState(mission?.briefAr || "");
  const [requiredLevel, setRequiredLevel] = useState(
    String(mission?.requiredLevel || 1),
  );
  const [rewardXp, setRewardXp] = useState(String(mission?.rewardXp || 0));
  const [badgeRewardId, setBadgeRewardId] = useState(
    mission?.badgeRewardId || "",
  );
  const [sortOrder, setSortOrder] = useState(
    typeof mission?.sortOrder === "number" ? String(mission.sortOrder) : "",
  );
  const [positionX, setPositionX] = useState(
    typeof mission?.positionX === "number" ? String(mission.positionX) : "",
  );
  const [positionY, setPositionY] = useState(
    typeof mission?.positionY === "number" ? String(mission.positionY) : "",
  );
  const [objectives, setObjectives] = useState<
    HeroJourneyMissionObjectivePayload[]
  >(missionObjectivesForForm(mission));
  const [error, setError] = useState<string | null>(null);
  const [lessonOptions, setLessonOptions] = useState<RelatedSelectOption[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [isResolvingLinkedLessonScope, setIsResolvingLinkedLessonScope] =
    useState(false);
  const [hasResolvedLinkedLessonScope, setHasResolvedLinkedLessonScope] =
    useState(false);
  const selectedStage = stageOptions.find((option) => option.value === stageId);
  const selectedGrade = gradeOptions.find((option) => option.value === gradeId);
  const selectedSection = sectionOptions.find(
    (option) => option.value === sectionId,
  );
  const selectedClassroom = classroomOptions.find(
    (option) => option.value === classroomId,
  );
  const selectedStageTokens = [
    stageId,
    selectedStage?.label,
    selectedStage?.searchText,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  const relatedGradeOptions = gradeOptions.filter(
    (option) => !stageId || option.stageId === stageId,
  );
  const relatedSectionOptions = sectionOptions.filter(
    (option) => !gradeId || option.gradeId === gradeId,
  );
  const relatedClassroomOptions = classroomOptions.filter(
    (option) => !sectionId || option.sectionId === sectionId,
  );
  const visibleGradeOptions = withSelectedOption(
    relatedGradeOptions,
    gradeId,
    missionMetadata?.academicScope?.gradeLabel || t("placeholders.selectedGrade"),
  );
  const visibleSectionOptions = withSelectedOption(
    relatedSectionOptions,
    sectionId,
    missionMetadata?.academicScope?.sectionLabel || t("placeholders.selectedSection"),
  );
  const visibleClassroomOptions = withSelectedOption(
    relatedClassroomOptions,
    classroomId,
    missionMetadata?.academicScope?.classroomLabel || t("placeholders.selectedClassroom"),
  );
  const relatedSubjectOptions = subjectOptions.filter(
    (option) => {
      const gradeIds = option.gradeIds || [];
      const matchesGrade =
        !gradeId || gradeIds.length === 0 || gradeIds.includes(gradeId);
      const matchesStage =
        !stageId ||
        !option.stageId ||
        selectedStageTokens.some((token) =>
          String(option.stageId).toLowerCase().includes(token),
        ) ||
        selectedStageTokens.some((token) =>
          token.includes(String(option.stageId).toLowerCase()),
        );

      return matchesGrade && matchesStage;
    },
  );
  const relatedLessonOptions = lessonOptions.filter(
    (option) => !subjectId || option.subjectId === subjectId,
  );
  const visibleLessonOptions = withSelectedOption(
    relatedLessonOptions,
    linkedLessonRef,
    mission?.linkedLessonTitleEn || t("placeholders.selectedLesson"),
  );
  const relatedAssessmentOptions = assessmentOptions.filter((option) => {
    if (!subjectId || option.subjectId !== subjectId) return false;
    const optionScopeType = option.scopeType?.toLowerCase();
    if (!optionScopeType || !option.scopeId || optionScopeType === "school") {
      return true;
    }

    const selectedScopes = [
      { type: "stage", id: stageId },
      { type: "grade", id: gradeId },
      { type: "section", id: sectionId },
      { type: "classroom", id: classroomId },
    ];

    return selectedScopes.some(
      (scope) =>
        scope.id && optionScopeType === scope.type && option.scopeId === scope.id,
    );
  });
  const selectedAssessment = assessmentOptions.find(
    (option) => option.value === linkedAssessmentId,
  );
  const visibleAssessmentOptions = withSelectedOption(
    relatedAssessmentOptions,
    linkedAssessmentId,
    selectedAssessment?.label ||
      mission?.linkedQuizTitleEn ||
      t("placeholders.selectedAssessment"),
  );
  const visibleBadgeOptions = withSelectedOption(
    badges.map((badge) => ({
      value: badge.id,
      label: badge.nameEn || badge.slug,
    })),
    badgeRewardId,
    mission?.badgeRewardNameEn ||
      mission?.badgeRewardSlug ||
      t("placeholders.selectedBadge"),
  );

  const handleStageChange = (nextStageId: string) => {
    setStageId(nextStageId);
    setGradeId("");
    setSectionId("");
    setClassroomId("");
    setSubjectId("");
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
  };

  const handleGradeChange = (nextGradeId: string) => {
    setGradeId(nextGradeId);
    setSectionId("");
    setClassroomId("");
    setSubjectId("");
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
  };

  const handleSectionChange = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setClassroomId("");
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setHasResolvedLinkedLessonScope(false);
  };

  const handleClassroomChange = (nextClassroomId: string) => {
    setClassroomId(nextClassroomId);
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setHasResolvedLinkedLessonScope(false);
  };

  const handleSubjectChange = (nextSubjectId: string) => {
    setSubjectId(nextSubjectId);
    setLinkedLessonRef("");
    setLinkedAssessmentId("");
    setLessonOptions([]);
    setLessonsError(null);
    setHasResolvedLinkedLessonScope(false);
  };

  useEffect(() => {
    if (!selectedAssessment) {
      return;
    }

    const assessmentScopeType = selectedAssessment.scopeType?.toLowerCase();
    const nextSectionId =
      selectedAssessment.sectionId ||
      (assessmentScopeType === "section" ? selectedAssessment.scopeId : "");
    const nextClassroomId =
      selectedAssessment.classroomId ||
      (assessmentScopeType === "classroom" ? selectedAssessment.scopeId : "");
    const classroomSectionId =
      classroomOptions.find((option) => option.value === nextClassroomId)
        ?.sectionId || "";
    const resolvedSectionId = nextSectionId || classroomSectionId;

    if ((sectionId || !resolvedSectionId) && (classroomId || !nextClassroomId)) {
      return;
    }

    queueMicrotask(() => {
      if (!sectionId && resolvedSectionId) {
        setSectionId(resolvedSectionId);
      }

      if (!classroomId && nextClassroomId) {
        setClassroomId(nextClassroomId);
      }
    });
  }, [classroomId, classroomOptions, sectionId, selectedAssessment]);

  useEffect(() => {
    if (!gradeId || !subjectId) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setLessonsLoading(true);
          setLessonsError(null);
        }
        return onLoadLessons(gradeId, subjectId);
      })
      .then((options) => {
        if (!cancelled) {
          setLessonOptions(options);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLessonOptions([]);
          setLessonsError(t("errors.loadLessonsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLessonsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gradeId, onLoadLessons, subjectId, t]);

  useEffect(() => {
    if (
      gradeId ||
      !subjectId ||
      !linkedLessonRef ||
      gradeOptions.length === 0 ||
      hasResolvedLinkedLessonScope
    ) {
      return;
    }

    let cancelled = false;

    const subjectGradeIds =
      subjectOptions.find((option) => option.value === subjectId)?.gradeIds || [];
    const candidateGrades = gradeOptions.filter((option) => {
      if (stageId && option.stageId && option.stageId !== stageId) {
        return false;
      }

      return subjectGradeIds.length === 0 || subjectGradeIds.includes(option.value);
    });

    void Promise.resolve()
      .then(async () => {
        if (!cancelled) {
          setIsResolvingLinkedLessonScope(true);
        }

        for (const gradeOption of candidateGrades) {
          const options = await onLoadLessons(gradeOption.value, subjectId);
          if (cancelled) return;

          if (options.some((option) => option.value === linkedLessonRef)) {
            setGradeId(gradeOption.value);
            setLessonOptions(options);
            setHasResolvedLinkedLessonScope(true);
            return;
          }
        }

        setHasResolvedLinkedLessonScope(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLessonsError(t("errors.loadLessonsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingLinkedLessonScope(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    gradeId,
    gradeOptions,
    hasResolvedLinkedLessonScope,
    linkedLessonRef,
    onLoadLessons,
    stageId,
    subjectId,
    subjectOptions,
    t,
  ]);

  const updateObjective = (
    index: number,
    patch: Partial<HeroJourneyMissionObjectivePayload>,
  ) => {
    setObjectives((current) =>
      current.map((objective, currentIndex) =>
        currentIndex === index ? { ...objective, ...patch } : objective,
      ),
    );
  };

  const removeObjective = (index: number) => {
    setObjectives((current) =>
      current.length === 1
        ? current
        : current.filter((_objective, currentIndex) => currentIndex !== index),
    );
  };

  const handleSubmit = () => {
    const cleanObjectives = objectives
      .map((objective, index) => ({
        ...objective,
        titleEn: objective.titleEn?.trim() || undefined,
        titleAr: objective.titleAr?.trim() || undefined,
        sortOrder: objective.sortOrder ?? index + 1,
      }))
      .filter((objective) => objective.titleEn || objective.titleAr);

    if (!stageId.trim()) {
      setError(t("errors.stageRequired"));
      return;
    }

    if (!titleEn.trim() && !titleAr.trim()) {
      setError(t("errors.titleRequired"));
      return;
    }

    if (cleanObjectives.length === 0) {
      setError(t("errors.objectiveRequired"));
      return;
    }

    onSubmit({
      stageId: stageId.trim(),
      subjectId: subjectId.trim() || undefined,
      linkedAssessmentId: linkedAssessmentId.trim() || undefined,
      linkedLessonRef: linkedLessonRef.trim() || undefined,
      titleEn: titleEn.trim() || undefined,
      titleAr: titleAr.trim() || undefined,
      briefEn: briefEn.trim() || undefined,
      briefAr: briefAr.trim() || undefined,
      requiredLevel: requiredLevel ? Number(requiredLevel) : undefined,
      rewardXp: rewardXp ? Number(rewardXp) : undefined,
      badgeRewardId: badgeRewardId || undefined,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
      positionX: positionX ? Number(positionX) : undefined,
      positionY: positionY ? Number(positionY) : undefined,
      metadata: {
        ...(mission?.metadata || {}),
        academicScope: {
          stageId: stageId.trim(),
          gradeId: gradeId.trim() || undefined,
          sectionId: sectionId.trim() || undefined,
          classroomId: classroomId.trim() || undefined,
          gradeLabel: selectedGrade?.label,
          sectionLabel: selectedSection?.label,
          classroomLabel: selectedClassroom?.label,
        },
      },
      objectives: cleanObjectives,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mission ? t("editTitle") : t("createTitle")}
      size="xl"
      footer={
        <>
          {onRefreshOptions ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onRefreshOptions}
              disabled={loading || optionsLoading}
              loading={optionsLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              {tCommon("refresh")}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || optionsLoading}
          >
            {mission
              ? tCommon("save", { defaultMessage: "Save" })
              : t("createTitle")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormSection
          title={t("sections.basics.title")}
          description={t("sections.basics.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label={t("labels.academicYear")}
              value={academicYearLabel}
              disabled
            />
            <Input label={t("labels.term")} value={termLabel} disabled />
            <Select
              label={t("labels.stage")}
              value={stageId}
              options={stageOptions}
              onChange={handleStageChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingStages")
                  : t("placeholders.selectStage")
              }
              searchable
              required
              disabled={optionsLoading}
            />
            <Select
              label={t("labels.grade")}
              value={gradeId}
              options={[
                { value: "", label: t("placeholders.noGrade") },
                ...visibleGradeOptions,
              ]}
              onChange={handleGradeChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingGrades")
                  : t("placeholders.selectGrade")
              }
              searchable
              disabled={optionsLoading || !stageId}
              noOptionsText={
                stageId
                  ? t("placeholders.noGradeItems")
                  : t("placeholders.selectStageFirst")
              }
            />
            <Select
              label={t("labels.section")}
              value={sectionId}
              options={[
                { value: "", label: t("placeholders.noSection") },
                ...visibleSectionOptions,
              ]}
              onChange={handleSectionChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingSections")
                  : t("placeholders.selectSection")
              }
              searchable
              disabled={optionsLoading || !gradeId}
              noOptionsText={
                gradeId
                  ? t("placeholders.noSectionItems")
                  : t("placeholders.selectGradeFirst")
              }
            />
            <Select
              label={t("labels.classroom")}
              value={classroomId}
              options={[
                { value: "", label: t("placeholders.noClassroom") },
                ...visibleClassroomOptions,
              ]}
              onChange={handleClassroomChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingClassrooms")
                  : t("placeholders.selectClassroom")
              }
              searchable
              disabled={optionsLoading || !sectionId}
              noOptionsText={
                sectionId
                  ? t("placeholders.noClassroomItems")
                  : t("placeholders.selectSectionFirst")
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("labels.titleEn")}
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
            />
            <Input
              label={t("labels.titleAr")}
              value={titleAr}
              onChange={(event) => setTitleAr(event.target.value)}
              dir="rtl"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextArea
              label={t("labels.briefEn")}
              value={briefEn}
              onChange={(event) => setBriefEn(event.target.value)}
            />
            <TextArea
              label={t("labels.briefAr")}
              value={briefAr}
              onChange={(event) => setBriefAr(event.target.value)}
              dir="rtl"
            />
          </div>
        </FormSection>

        <FormSection
          title={t("sections.links.title")}
          description={t("sections.links.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label={t("labels.subject")}
              value={subjectId}
              options={[
                { value: "", label: t("placeholders.noSubject") },
                ...relatedSubjectOptions,
              ]}
              onChange={handleSubjectChange}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingSubjects")
                  : t("placeholders.selectSubject")
              }
              searchable
              disabled={optionsLoading}
            />
            <Select
              label={t("labels.linkedLesson")}
              value={linkedLessonRef}
              options={[
                { value: "", label: t("placeholders.noLesson") },
                ...visibleLessonOptions,
              ]}
              onChange={setLinkedLessonRef}
              placeholder={
                optionsLoading || lessonsLoading || isResolvingLinkedLessonScope
                  ? t("placeholders.loadingLessons")
                  : t("placeholders.selectLesson")
              }
              searchable
              disabled={
                optionsLoading ||
                lessonsLoading ||
                isResolvingLinkedLessonScope ||
                !gradeId ||
                !subjectId
              }
              noOptionsText={
                !gradeId
                  ? t("placeholders.selectGradeFirst")
                  : subjectId
                    ? t("placeholders.noLessonItems")
                    : t("placeholders.selectSubjectFirst")
              }
            />
            <Select
              label={t("labels.linkedAssessment")}
              value={linkedAssessmentId}
              options={[
                { value: "", label: t("placeholders.noAssessment") },
                ...visibleAssessmentOptions,
              ]}
              onChange={setLinkedAssessmentId}
              placeholder={
                optionsLoading
                  ? t("placeholders.loadingAssessments")
                  : t("placeholders.selectAssessment")
              }
              searchable
              disabled={optionsLoading || !subjectId}
              noOptionsText={
                subjectId
                  ? t("placeholders.noAssessmentItems")
                  : t("placeholders.selectSubjectFirst")
              }
            />
          </div>
          {lessonsError ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {lessonsError}
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title={t("sections.rewards.title")}
          description={t("sections.rewards.description")}
        >
          <div className="flex flex-wrap gap-4">
            <Input
              label={t("labels.requiredLevel")}
              type="number"
              value={requiredLevel}
              onChange={(event) => setRequiredLevel(event.target.value)}
            />
            <Input
              label={t("labels.rewardXp")}
              type="number"
              value={rewardXp}
              onChange={(event) => setRewardXp(event.target.value)}
            />
            <Input
              label={t("labels.sortOrder")}
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
            <Input
              label={t("labels.mapX")}
              type="number"
              value={positionX}
              onChange={(event) => setPositionX(event.target.value)}
            />
            <Input
              label={t("labels.mapY")}
              type="number"
              value={positionY}
              onChange={(event) => setPositionY(event.target.value)}
            />
            <Select
              label={t("labels.badgeReward")}
              value={badgeRewardId}
              placeholder={t("placeholders.noBadge")}
              options={[
                { value: "", label: t("placeholders.noBadge") },
                ...visibleBadgeOptions,
              ]}
              onChange={setBadgeRewardId}
              searchable
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-500">
            {t("helper.mapCoordinates")}
          </p>
        </FormSection>

        {optionsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {optionsError}
          </div>
        ) : null}

        <FormSection
          title={t("sections.objectives.title")}
          description={t("sections.objectives.description")}
        >
          <div className="mb-3 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() =>
                setObjectives((current) => [
                  ...current,
                  { ...blankObjective(), sortOrder: current.length + 1 },
                ])
              }
            >
              {t("actions.addObjective")}
            </Button>
          </div>

          <div className="space-y-3">
            {objectives.map((objective, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-[1fr_1fr_110px_44px]"
              >
                <Input
                  label={t("labels.objectiveTitleEn")}
                  value={objective.titleEn || ""}
                  onChange={(event) =>
                    updateObjective(index, { titleEn: event.target.value })
                  }
                />
                <Input
                  label={t("labels.objectiveTitleAr")}
                  value={objective.titleAr || ""}
                  onChange={(event) =>
                    updateObjective(index, { titleAr: event.target.value })
                  }
                  dir="rtl"
                />
                <Input
                  label={t("labels.objectiveOrder")}
                  type="number"
                  value={String(objective.sortOrder || index + 1)}
                  onChange={(event) =>
                    updateObjective(index, {
                      sortOrder: Number(event.target.value),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  disabled={objectives.length === 1}
                  className="mt-6 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  title={t("actions.removeObjective")}
                  aria-label={t("actions.removeObjective")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

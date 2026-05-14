"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { useAuth } from "@/hooks/use-auth";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "./ReinforcementAcademicContextFilter";
import ReinforcementTaskTargetSelector, {
  type ReinforcementTaskTargetSelection,
} from "./ReinforcementTaskTargetSelector";
import ReinforcementTaskStagesEditor, {
  createEmptyTaskStage,
  mapTaskStagesToPayload,
  type ReinforcementTaskStageDraft,
} from "./ReinforcementTaskStagesEditor";
import type {
  CreateReinforcementTaskPayload,
  ReinforcementRewardType,
  ReinforcementSource,
} from "../types";

interface ReinforcementTaskFormProps {
  onSubmit: (payload: CreateReinforcementTaskPayload) => Promise<void>;
}

interface TaskDraft {
  context: ReinforcementAcademicContextValue;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  rewardLabelEn: string;
  rewardLabelAr: string;
  dueDate: string;
  targets: ReinforcementTaskTargetSelection[];
  stages: ReinforcementTaskStageDraft[];
}

type FormErrors = Partial<Record<string, string>>;

const formatDateInput = (date: Date): string => date.toISOString().slice(0, 10);

export const getDefaultReinforcementDueDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateInput(date);
};

const optionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export function buildReinforcementTaskPayload(
  draft: TaskDraft,
  assignedById?: string,
  assignedByName?: string,
): CreateReinforcementTaskPayload {
  const fallbackTitle = draft.titleEn.trim() || draft.titleAr.trim();
  return {
    academicYearId: draft.context.academicYearId,
    yearId: draft.context.academicYearId,
    termId: draft.context.termId,
    subjectId: draft.context.subjectId,
    titleEn: draft.titleEn.trim() || fallbackTitle,
    titleAr: draft.titleAr.trim() || fallbackTitle,
    descriptionEn: optionalString(draft.descriptionEn),
    descriptionAr: optionalString(draft.descriptionAr),
    source: draft.source,
    rewardType: draft.rewardType,
    rewardValue: optionalString(draft.rewardValue),
    rewardLabelEn: optionalString(draft.rewardLabelEn),
    rewardLabelAr: optionalString(draft.rewardLabelAr),
    dueDate: draft.dueDate,
    assignedById,
    assignedByName,
    targets: draft.targets.map((target) => ({
      scopeType: target.scopeType,
      scopeId: target.scopeId,
    })),
    stages: mapTaskStagesToPayload(draft.stages),
  };
}

export default function ReinforcementTaskForm({
  onSubmit,
}: ReinforcementTaskFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { user } = useAuth();
  const assignedByName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const [draft, setDraft] = useState<TaskDraft>({
    context: {},
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    source: "teacher",
    rewardType: "xp",
    rewardValue: "",
    rewardLabelEn: "",
    rewardLabelAr: "",
    dueDate: getDefaultReinforcementDueDate(),
    targets: [],
    stages: [createEmptyTaskStage()],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const stageErrors = useMemo(() => {
    const next: Record<number, string> = {};
    draft.stages.forEach((stage, index) => {
      if (!stage.titleEn.trim() && !stage.titleAr.trim()) {
        next[index] = errors[`stage-${index}`] || "";
      }
    });
    return next;
  }, [draft.stages, errors]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!draft.context.academicYearId) next.academicYear = t("validation.required");
    if (!draft.context.termId) next.term = t("validation.required");
    if (!draft.titleEn.trim() && !draft.titleAr.trim()) {
      next.title = t("validation.titleRequired");
    }
    if (!draft.dueDate) next.dueDate = t("validation.futureDueDateRequired");
    if (draft.targets.length === 0) next.targets = t("validation.targetRequired");
    if (draft.stages.length === 0) next.stages = t("validation.stageRequired");
    draft.stages.forEach((stage, index) => {
      if (!stage.titleEn.trim() && !stage.titleAr.trim()) {
        next[`stage-${index}`] = t("validation.titleRequired");
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(
        buildReinforcementTaskPayload(
          draft,
          user?.id,
          assignedByName || user?.email,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.context")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("tasks.form.contextDescription")}
        </p>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={draft.context}
            showStudent
            showSubject
            onChange={(selection: ReinforcementAcademicContextSelection) =>
              setDraft((current) => ({
                ...current,
                context: {
                  academicYearId: selection.academicYearId,
                  termId: selection.termId,
                  stageId: selection.stageId,
                  gradeId: selection.gradeId,
                  sectionId: selection.sectionId,
                  classroomId: selection.classroomId,
                  subjectId: selection.subjectId,
                  studentId: selection.studentId,
                  enrollmentId: selection.enrollmentId,
                },
              }))
            }
          />
        </div>
        {(errors.academicYear || errors.term) && (
          <p className="mt-3 text-sm text-red-600">
            {errors.academicYear || errors.term}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.details")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label={t("tasks.form.titleEn")}
            value={draft.titleEn}
            error={errors.title}
            onChange={(event) =>
              setDraft({ ...draft, titleEn: event.target.value })
            }
          />
          <Input
            label={t("tasks.form.titleAr")}
            value={draft.titleAr}
            error={errors.title}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, titleAr: event.target.value })
            }
          />
          <TextArea
            label={t("tasks.form.descriptionEn")}
            value={draft.descriptionEn}
            onChange={(event) =>
              setDraft({ ...draft, descriptionEn: event.target.value })
            }
          />
          <TextArea
            label={t("tasks.form.descriptionAr")}
            value={draft.descriptionAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, descriptionAr: event.target.value })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.reward")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label={t("tasks.form.source")}
            value={draft.source}
            onChange={(value) =>
              setDraft({ ...draft, source: value as ReinforcementSource })
            }
            options={[
              { value: "teacher", label: t("source.teacher") },
              { value: "parent", label: t("source.parent") },
              { value: "system", label: t("source.system") },
            ]}
          />
          <Select
            label={t("tasks.form.rewardType")}
            value={draft.rewardType}
            onChange={(value) =>
              setDraft({ ...draft, rewardType: value as ReinforcementRewardType })
            }
            options={[
              { value: "xp", label: t("rewardType.xp") },
              { value: "badge", label: t("rewardType.badge") },
              { value: "moral", label: t("rewardType.moral") },
              { value: "financial", label: t("rewardType.financial") },
            ]}
          />
          <Input
            label={t("tasks.form.rewardValue")}
            value={draft.rewardValue}
            onChange={(event) =>
              setDraft({ ...draft, rewardValue: event.target.value })
            }
          />
          <Input
            label={t("tasks.form.rewardLabelEn")}
            value={draft.rewardLabelEn}
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelEn: event.target.value })
            }
          />
          <Input
            label={t("tasks.form.rewardLabelAr")}
            value={draft.rewardLabelAr}
            dir="rtl"
            onChange={(event) =>
              setDraft({ ...draft, rewardLabelAr: event.target.value })
            }
          />
          <Input
            type="date"
            label={t("tasks.form.dueDate")}
            value={draft.dueDate}
            error={errors.dueDate}
            onChange={(event) =>
              setDraft({ ...draft, dueDate: event.target.value })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("tasks.form.targets")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("tasks.form.targetsDescription")}
        </p>
        <div className="mt-4">
          <ReinforcementTaskTargetSelector
            academicYearId={draft.context.academicYearId}
            termId={draft.context.termId}
            defaultScope="student"
            value={draft.targets}
            onChange={(targets) => setDraft({ ...draft, targets })}
          />
        </div>
        {errors.targets ? (
          <p className="mt-3 text-sm text-red-600">{errors.targets}</p>
        ) : null}
      </section>

      <ReinforcementTaskStagesEditor
        stages={draft.stages}
        errors={stageErrors}
        onChange={(stages) => setDraft({ ...draft, stages })}
      />
      {errors.stages ? (
        <p className="text-sm text-red-600">{errors.stages}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" loading={saving} onClick={handleSubmit}>
          {t("tasks.form.create")}
        </Button>
      </div>
    </div>
  );
}

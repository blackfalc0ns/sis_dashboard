"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import {
  createGrade,
  createSection,
  createStage,
  type Grade,
  type Stage,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface AcademicStructureSetupStepCopy {
  summary: string;
  stageTitle: string;
  gradeTitle: string;
  sectionTitle: string;
  nameAr: string;
  nameEn: string;
  save: string;
  saving: string;
  required: string;
  saveFailed: string;
  stageCreated: string;
  gradeCreated: string;
  sectionCreated: string;
  complete: string;
  progressLabel: string;
  progressText(completed: number, total: number): string;
  stage: string;
  grade: string;
  section: string;
  done: string;
  remaining: string;
}

interface AcademicStructureSetupStepProps {
  copy: AcademicStructureSetupStepCopy;
  yearId: string;
  termId: string;
  tree: StructureTree;
  refreshStep(stepId: "structure"): Promise<void> | void;
}

type NextAction =
  | { type: "stage"; title: string; order: number }
  | { type: "grade"; title: string; stage: Stage; order: number }
  | { type: "section"; title: string; grade: Grade; order: number }
  | { type: "complete"; title: string };

const completedStepsByAction = {
  stage: 0,
  grade: 1,
  section: 2,
  complete: 3,
} as const;

function resolveNextAction(tree: StructureTree, copy: AcademicStructureSetupStepCopy): NextAction {
  const firstStage = tree.stages[0];
  if (!firstStage) {
    return { type: "stage", title: copy.stageTitle, order: tree.stages.length + 1 };
  }

  const gradesForStage = tree.grades.filter((grade) => grade.stageId === firstStage.id);
  const firstGrade = gradesForStage[0];
  if (!firstGrade) {
    return {
      type: "grade",
      title: copy.gradeTitle,
      stage: firstStage,
      order: gradesForStage.length + 1,
    };
  }

  const sectionsForGrade = tree.sections.filter((section) => section.gradeId === firstGrade.id);
  if (sectionsForGrade.length === 0) {
    return {
      type: "section",
      title: copy.sectionTitle,
      grade: firstGrade,
      order: sectionsForGrade.length + 1,
    };
  }

  return { type: "complete", title: copy.complete };
}

export function AcademicStructureSetupStep({
  copy,
  yearId,
  termId,
  tree,
  refreshStep,
}: AcademicStructureSetupStepProps) {
  const nextAction = useMemo(() => resolveNextAction(tree, copy), [copy, tree]);
  const completedSteps = completedStepsByAction[nextAction.type];
  const actionKey =
    nextAction.type === "grade"
      ? `${nextAction.type}:${nextAction.stage.id}`
      : nextAction.type === "section"
        ? `${nextAction.type}:${nextAction.grade.id}`
        : nextAction.type;
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [formActionKey, setFormActionKey] = useState(actionKey);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const currentNameAr = formActionKey === actionKey ? nameAr : "";
  const currentNameEn = formActionKey === actionKey ? nameEn : "";

  const successNotice = success ? (
    <p
      aria-live="polite"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
      role="status"
    >
      {success}
    </p>
  ) : null;

  const progressIndicator = (
    <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-800">
        <span>{copy.progressLabel}</span>
        <span aria-live="polite">{copy.progressText(completedSteps, 3)}</span>
      </div>
      <div
        aria-label={copy.progressLabel}
        aria-valuemax={3}
        aria-valuemin={0}
        aria-valuenow={completedSteps}
        className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${(completedSteps / 3) * 100}%` }}
        />
      </div>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        {[
          { label: copy.stage, complete: completedSteps >= 1 },
          { label: copy.grade, complete: completedSteps >= 2 },
          { label: copy.section, complete: completedSteps >= 3 },
        ].map(({ label, complete }) => {
          const StatusIcon = complete ? CheckCircle2 : Circle;
          const status = complete ? copy.done : copy.remaining;

          return (
            <li
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-medium ${
                complete ? "bg-emerald-50 text-emerald-800" : "bg-white text-gray-600"
              }`}
              key={label}
            >
              <StatusIcon aria-hidden className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              <span className="ms-auto text-xs">{status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (nextAction.type === "complete") {
    return (
      <div className="space-y-2">
        {progressIndicator}
        {successNotice}
        <h3 className="text-base font-semibold text-gray-950">{nextAction.title}</h3>
        <p className="text-sm text-gray-600">{copy.summary}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!currentNameAr.trim() || !currentNameEn.trim()) {
      setError(copy.required);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const basePayload = {
        name: currentNameEn.trim() || currentNameAr.trim(),
        nameAr: currentNameAr.trim(),
        nameEn: currentNameEn.trim(),
        order: nextAction.order,
      };

      if (nextAction.type === "stage") {
        await createStage(yearId, termId, basePayload);
        setSuccess(copy.stageCreated);
      } else if (nextAction.type === "grade") {
        await createGrade(yearId, termId, {
          ...basePayload,
          stageId: nextAction.stage.id,
          capacity: 30,
        });
        setSuccess(copy.gradeCreated);
      } else {
        await createSection(yearId, termId, {
          ...basePayload,
          gradeId: nextAction.grade.id,
          capacity: 30,
        });
        setSuccess(copy.sectionCreated);
      }

      setNameAr("");
      setNameEn("");
      setFormActionKey(actionKey);
      await refreshStep("structure");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {progressIndicator}
      <div>
        <h3 className="text-base font-semibold text-gray-950">{nextAction.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{copy.summary}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          dir="rtl"
          label={copy.nameAr}
          onChange={(event) => {
            setNameAr(event.target.value);
            setFormActionKey(actionKey);
            setError("");
            setSuccess("");
          }}
          value={currentNameAr}
        />
        <Input
          label={copy.nameEn}
          onChange={(event) => {
            setNameEn(event.target.value);
            setFormActionKey(actionKey);
            setError("");
            setSuccess("");
          }}
          value={currentNameEn}
        />
      </div>
      {successNotice}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button loading={isSaving} onClick={() => void handleSubmit()} type="button">
        {isSaving ? copy.saving : copy.save}
      </Button>
    </div>
  );
}

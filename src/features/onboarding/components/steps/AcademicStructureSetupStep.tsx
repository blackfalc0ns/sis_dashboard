"use client";

import { useEffect, useMemo, useState } from "react";
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
  complete: string;
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
  const actionKey =
    nextAction.type === "grade"
      ? `${nextAction.type}:${nextAction.stage.id}`
      : nextAction.type === "section"
        ? `${nextAction.type}:${nextAction.grade.id}`
        : nextAction.type;
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNameAr("");
    setNameEn("");
    setError("");
  }, [actionKey]);

  if (nextAction.type === "complete") {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-950">{nextAction.title}</h3>
        <p className="text-sm text-gray-600">{copy.summary}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!nameAr.trim() || !nameEn.trim()) {
      setError(copy.required);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const basePayload = {
        name: nameEn.trim() || nameAr.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        order: nextAction.order,
      };

      if (nextAction.type === "stage") {
        await createStage(yearId, termId, basePayload);
      } else if (nextAction.type === "grade") {
        await createGrade(yearId, termId, {
          ...basePayload,
          stageId: nextAction.stage.id,
          capacity: 30,
        });
      } else {
        await createSection(yearId, termId, {
          ...basePayload,
          gradeId: nextAction.grade.id,
          capacity: 30,
        });
      }

      setNameAr("");
      setNameEn("");
      await refreshStep("structure");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
            setError("");
          }}
          value={nameAr}
        />
        <Input
          label={copy.nameEn}
          onChange={(event) => {
            setNameEn(event.target.value);
            setError("");
          }}
          value={nameEn}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button loading={isSaving} onClick={() => void handleSubmit()} type="button">
        {isSaving ? copy.saving : copy.save}
      </Button>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  Grade,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import SubjectDialog from "@/features/academics/subjects/components/SubjectDialog";
import {
  bulkUpsertSubjectAllocations,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { SubjectsSetupData } from "../../types";

export interface SubjectsSetupStepCopy {
  summary: string;
  savedData: string;
  edit: string;
  cancel: string;
  subjectsCount(count: number): string;
  allocationsCount(count: number): string;
  createSubject: string;
  grade: string;
  subject: string;
  weeklyHours: string;
  saveAllocation: string;
  saving: string;
  saveFailed: string;
}

interface SubjectsSetupStepProps {
  copy: SubjectsSetupStepCopy;
  termId: string;
  stages: Stage[];
  grades: Grade[];
  subjectsData: SubjectsSetupData;
  refreshStep(stepId: "subjects"): Promise<void> | void;
}

export function SubjectsSetupStep({
  copy,
  termId,
  stages,
  grades,
  subjectsData,
  refreshStep,
}: SubjectsSetupStepProps) {
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjectsData.subjects[0]?.id ?? "");
  const [weeklyHours, setWeeklyHours] = useState("1");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const hasMinimumData =
    subjectsData.subjects.length > 0 && subjectsData.allocations.length > 0;
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const isEditing = !hasMinimumData || isManuallyEditing;

  const gradeOptions = useMemo(
    () => grades.map((grade) => ({ value: grade.id, label: grade.nameEn || grade.name })),
    [grades],
  );
  const subjectOptions = useMemo(
    () =>
      subjectsData.subjects.map((subject) => ({
        value: subject.id,
        label: subject.nameEn || subject.name,
      })),
    [subjectsData.subjects],
  );

  const handleSubjectSuccess = () => {
    void refreshStep("subjects");
  };

  const handleSaveAllocation = async () => {
    const hours = Number(weeklyHours);
    if (!gradeId || !subjectId || !Number.isFinite(hours) || hours <= 0) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const allocation: SubjectAllocation = { gradeId, subjectId, weeklyHours: hours };
      await bulkUpsertSubjectAllocations(termId, [allocation]);
      await refreshStep("subjects");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      {!isEditing ? (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-base font-semibold text-gray-950">{copy.savedData}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.subjectsCount(subjectsData.subjects.length)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-950">
                {copy.allocationsCount(subjectsData.allocations.length)}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsManuallyEditing(true)} type="button" variant="secondary">
            {copy.edit}
          </Button>
        </section>
      ) : null}
      {isEditing ? (
        subjectsData.subjects.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {hasMinimumData ? (
              <Button
                onClick={() => setIsManuallyEditing(false)}
                type="button"
                variant="secondary"
              >
                {copy.cancel}
              </Button>
            ) : null}
            <Button onClick={() => setIsSubjectDialogOpen(true)} type="button">
              {copy.createSubject}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto] md:items-end">
              <Select label={copy.grade} onChange={setGradeId} options={gradeOptions} value={gradeId} />
              <Select
                label={copy.subject}
                onChange={setSubjectId}
                options={subjectOptions}
                value={subjectId}
              />
              <Input
                inputMode="numeric"
                label={copy.weeklyHours}
                min={1}
                onChange={(event) => setWeeklyHours(event.target.value)}
                type="number"
                value={weeklyHours}
              />
              <Button loading={isSaving} onClick={() => void handleSaveAllocation()} type="button">
                {isSaving ? copy.saving : copy.saveAllocation}
              </Button>
            </div>
            {hasMinimumData ? (
              <Button
                onClick={() => setIsManuallyEditing(false)}
                type="button"
                variant="secondary"
              >
                {copy.cancel}
              </Button>
            ) : null}
          </div>
        )
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <SubjectDialog
        existingSubjects={subjectsData.subjects}
        isOpen={isSubjectDialogOpen}
        onClose={() => setIsSubjectDialogOpen(false)}
        onSuccess={handleSubjectSuccess}
        stages={stages}
        subject={null}
        termId={termId}
      />
    </div>
  );
}

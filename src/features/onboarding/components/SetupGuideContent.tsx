"use client";

import { useEffect, useMemo, useState } from "react";
import { setupSteps } from "../config/setupSteps";
import type { SetupEvaluation, SetupSnapshot, SetupStepId } from "../types";
import type { UseSetupStatusResult } from "../hooks/useSetupStatus";
import { SetupGuide, type SetupGuideCopy } from "./SetupGuide";
import { OrganizationSetupStep } from "./steps/OrganizationSetupStep";
import { AcademicContextSetupStep } from "./steps/AcademicContextSetupStep";
import { AcademicStructureSetupStep } from "./steps/AcademicStructureSetupStep";
import { SubjectsSetupStep } from "./steps/SubjectsSetupStep";
import { RoomsSetupStep } from "./steps/RoomsSetupStep";

const emptyAcademicContext = { years: [], termsByYear: {} };
const emptyStructure = { stages: [], grades: [], sections: [], classrooms: [] };
const emptySubjects = { subjects: [], allocations: [] };

export const defaultSetupGuideCopy: SetupGuideCopy = {
  title: "Quick school setup",
  progressLabel: "Setup progress",
  progressText: (completed, total, percent) => `${completed}/${total} complete (${percent}%)`,
  retry: "Retry",
  lockedPrefix: "Complete first",
  statuses: {
    complete: "Complete",
    available: "Available",
    locked: "Locked",
    loading: "Loading",
    error: "Needs attention",
  },
  steps: {
    organization: { title: "Organization", description: "Add core school profile data." },
    academicContext: { title: "Academic year", description: "Create the active year and term." },
    structure: { title: "Structure", description: "Create stage, grade, and section." },
    subjects: { title: "Subjects", description: "Create subjects and grade allocations." },
    rooms: { title: "Rooms", description: "Create the first room." },
  },
};

const organizationCopy = {
  summary: "Complete the school profile used across the dashboard.",
  schoolName: "School name",
  shortName: "Short name",
  timezone: "Timezone",
  addressLine: "Address",
  city: "City",
  country: "Country",
  save: "Save profile",
  saving: "Saving",
  required: "School name is required",
  saveFailed: "Could not save profile",
};

const academicContextCopy = {
  summary: "Create the academic year and terms used by academic pages.",
  yearsCount: (count: number) => `${count} years`,
  termsCount: (count: number) => `${count} terms`,
  createYear: "Create academic year",
  createTerm: "Create term",
};

const structureCopy = {
  summary: "Create the minimum academic structure chain.",
  stageTitle: "Create stage",
  gradeTitle: "Create grade",
  sectionTitle: "Create section",
  nameAr: "Arabic name",
  nameEn: "English name",
  save: "Create",
  saving: "Creating",
  required: "Both names are required",
  saveFailed: "Could not create structure item",
  complete: "Academic structure has the minimum required chain.",
};

const subjectsCopy = {
  summary: "Create subjects and allocate weekly hours to a grade.",
  createSubject: "Create subject",
  grade: "Grade",
  subject: "Subject",
  weeklyHours: "Weekly hours",
  saveAllocation: "Save allocation",
  saving: "Saving",
  saveFailed: "Could not save allocation",
};

const roomsCopy = {
  summary: "Create rooms used by timetables and room assignments.",
  createRoom: "Create room",
  missingSchool: "No school selected",
  saveFailed: "Could not create room",
};

function firstSelectableStep(evaluation: SetupEvaluation): SetupStepId {
  return (
    setupSteps.find((definition) => evaluation.steps[definition.id].status !== "locked")?.id ??
    "organization"
  );
}

function createStepContent(result: UseSetupStatusResult, snapshot: SetupSnapshot) {
  const academicData =
    snapshot.academicContext.status === "success"
      ? snapshot.academicContext.data
      : snapshot.academicContext.data ?? emptyAcademicContext;
  const structure =
    snapshot.structure.status === "success"
      ? snapshot.structure.data
      : snapshot.structure.data ?? emptyStructure;
  const subjectsData =
    snapshot.subjects.status === "success"
      ? snapshot.subjects.data
      : snapshot.subjects.data ?? emptySubjects;

  return {
    organization: (
      <OrganizationSetupStep
        copy={organizationCopy}
        profile={snapshot.organization.status === "success" ? snapshot.organization.data : null}
        refreshStep={result.refreshStep}
      />
    ),
    academicContext: (
      <AcademicContextSetupStep
        copy={academicContextCopy}
        data={academicData}
        refreshStep={result.refreshStep}
        selectedYear={result.selectedYear}
      />
    ),
    structure: (
      <AcademicStructureSetupStep
        copy={structureCopy}
        refreshStep={result.refreshStep}
        termId={result.selectedTerm?.id ?? ""}
        tree={structure}
        yearId={result.selectedYear?.id ?? ""}
      />
    ),
    subjects: (
      <SubjectsSetupStep
        copy={subjectsCopy}
        grades={structure.grades}
        refreshStep={result.refreshStep}
        stages={structure.stages}
        subjectsData={subjectsData}
        termId={result.selectedTerm?.id ?? ""}
      />
    ),
    rooms: <RoomsSetupStep copy={roomsCopy} refreshStep={result.refreshStep} schoolId={result.schoolId} />,
  };
}

interface SetupGuideContentProps {
  result: UseSetupStatusResult;
  title?: string;
}

export function SetupGuideContent({ result, title }: SetupGuideContentProps) {
  const [selectedStepId, setSelectedStepId] = useState<SetupStepId>(() =>
    firstSelectableStep(result.evaluation),
  );
  const copy = useMemo(
    () => (title ? { ...defaultSetupGuideCopy, title } : defaultSetupGuideCopy),
    [title],
  );

  useEffect(() => {
    if (result.evaluation.steps[selectedStepId].status === "locked") {
      setSelectedStepId(firstSelectableStep(result.evaluation));
    }
  }, [result.evaluation, selectedStepId]);

  return (
    <SetupGuide
      copy={copy}
      evaluation={result.evaluation}
      onRetryStep={result.retryStep}
      onSelectStep={setSelectedStepId}
      selectedStepId={selectedStepId}
      stepContent={createStepContent(result, result.snapshot)}
    />
  );
}

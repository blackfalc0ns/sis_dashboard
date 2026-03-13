"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Save } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import WizardStepper from "@/features/academics/timetable/components/WizardStepper";
import { isPolicyNameUnique } from "../services/attendancePolicyService";
import { getScopeSelectionMissingFields } from "@/features/attendance/shared/attendanceScope";
import { fetchTimetableConfigs } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import Step1BasicInfo from "./wizard/Step1BasicInfo";
import Step2Scope from "./wizard/Step2Scope";
import Step3ModeComputation from "./wizard/Step3ModeComputation";
import Step4Rules from "./wizard/Step4Rules";
import Step5Review from "./wizard/Step5Review";
import type { AttendancePolicy, PolicyFormData } from "../types";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

interface PolicyWizardDialogProps {
  isOpen: boolean;
  policy: AttendancePolicy | null;
  term: Term | null;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  onSave: (data: PolicyFormData) => Promise<void>;
  onClose: () => void;
}

export default function PolicyWizardDialog({
  isOpen,
  policy,
  term,
  stages,
  grades,
  sections,
  classrooms,
  isReadOnly,
  onSave,
  onClose,
}: PolicyWizardDialogProps) {
  const t = useTranslations("attendance.policies.wizard");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("attendance.policies.validation");
  const locale = useLocale();

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<PolicyFormData>({
    yearId: policy?.yearId || "",
    termId: policy?.termId || "",
    nameAr: policy?.nameAr || "",
    nameEn: policy?.nameEn || "",
    descriptionAr: policy?.descriptionAr || "",
    descriptionEn: policy?.descriptionEn || "",
    notesAr: policy?.notesAr || "",
    notesEn: policy?.notesEn || "",
    scopeType: policy?.scopeType || "SCHOOL",
    scopeIds: policy?.scopeIds || {},
    mode: policy?.mode || "DAILY",
    dailyComputationStrategy: policy?.dailyComputationStrategy || "MANUAL",
    selectedPeriodIds: policy?.selectedPeriodIds || [],
    lateThresholdMinutes: policy?.lateThresholdMinutes ?? 15,
    earlyLeaveThresholdMinutes: policy?.earlyLeaveThresholdMinutes ?? 15,
    autoAbsentAfterMinutes: policy?.autoAbsentAfterMinutes,
    absentIfMissedPeriodsCount: policy?.absentIfMissedPeriodsCount,
    allowExcuses: policy?.allowExcuses ?? true,
    requireExcuseReason: policy?.requireExcuseReason ?? false,
    requireAttachmentForExcuse: policy?.requireAttachmentForExcuse ?? false,
    notifyTeachers: policy?.notifyTeachers ?? true,
    notifyStudents: policy?.notifyStudents ?? false,
    notifyGuardians: policy?.notifyGuardians ?? true,
    notifyOnAbsent: policy?.notifyOnAbsent ?? true,
    notifyOnLate: policy?.notifyOnLate ?? true,
    notifyOnEarlyLeave: policy?.notifyOnEarlyLeave ?? false,
    effectiveStartDate: policy?.effectiveStartDate || "",
    effectiveEndDate: policy?.effectiveEndDate || "",
    isActive: policy?.isActive ?? true,
  });

  // Available periods from timetable config
  const [availablePeriods, setAvailablePeriods] = useState<TimetablePeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  // Reset form when dialog opens/closes or policy changes
  useEffect(() => {
    if (isOpen && policy) {
      // Migrate old period IDs to stable IDs
      const migratedPeriodIds = policy.selectedPeriodIds
        ? policy.selectedPeriodIds.map((id) => {
            // If old format "period-N", convert to stable ID
            const match = id.match(/^period-(\d+)$/);
            if (match) {
              const index = parseInt(match[1], 10);
              const period = availablePeriods.find((p) => p.index === index);
              return period ? period.id : id;
            }
            return id;
          })
        : [];

      setFormData({
        yearId: policy.yearId,
        termId: policy.termId,
        nameAr: policy.nameAr,
        nameEn: policy.nameEn,
        descriptionAr: policy.descriptionAr || "",
        descriptionEn: policy.descriptionEn || "",
        notesAr: policy.notesAr || "",
        notesEn: policy.notesEn || "",
        scopeType: policy.scopeType,
        scopeIds: policy.scopeIds || {},
        mode: "PERIOD", // Force PERIOD mode
        dailyComputationStrategy: undefined, // Not used anymore
        selectedPeriodIds: migratedPeriodIds,
        lateThresholdMinutes: policy.lateThresholdMinutes,
        earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes,
        autoAbsentAfterMinutes: undefined, // Not used anymore
        absentIfMissedPeriodsCount: policy.absentIfMissedPeriodsCount,
        allowExcuses: policy.allowExcuses,
        requireExcuseReason: policy.requireExcuseReason,
        requireAttachmentForExcuse: policy.requireAttachmentForExcuse,
        notifyTeachers: policy.notifyTeachers,
        notifyStudents: policy.notifyStudents,
        notifyGuardians: policy.notifyGuardians,
        notifyOnAbsent: policy.notifyOnAbsent,
        notifyOnLate: policy.notifyOnLate,
        notifyOnEarlyLeave: policy.notifyOnEarlyLeave,
        effectiveStartDate: policy.effectiveStartDate,
        effectiveEndDate: policy.effectiveEndDate,
        isActive: policy.isActive,
      });
      setIsDirty(false);
      setActiveStep(0);
      setErrors({});
    } else if (isOpen && !policy) {
      // New policy - use stable period IDs from the start
      const defaultPeriodIds =
        availablePeriods.length >= 2
          ? [availablePeriods[0].id, availablePeriods[1].id]
          : availablePeriods.length === 1
          ? [availablePeriods[0].id]
          : [];

      setFormData({
        yearId: term?.yearId || "",
        termId: term?.id || "",
        nameAr: "",
        nameEn: "",
        descriptionAr: "",
        descriptionEn: "",
        notesAr: "",
        notesEn: "",
        scopeType: "SCHOOL",
        scopeIds: {},
        mode: "PERIOD", // Force PERIOD mode
        dailyComputationStrategy: undefined, // Not used anymore
        selectedPeriodIds: defaultPeriodIds,
        lateThresholdMinutes: 15,
        earlyLeaveThresholdMinutes: 15,
        autoAbsentAfterMinutes: undefined, // Not used anymore
        absentIfMissedPeriodsCount: defaultPeriodIds.length || 1,
        allowExcuses: true,
        requireExcuseReason: false,
        requireAttachmentForExcuse: false,
        notifyTeachers: true,
        notifyStudents: false,
        notifyGuardians: true,
        notifyOnAbsent: true,
        notifyOnLate: true,
        notifyOnEarlyLeave: false,
        effectiveStartDate: term?.startDate || "",
        effectiveEndDate: term?.endDate || "",
        isActive: true,
      });
      setIsDirty(false);
      setActiveStep(0);
      setErrors({});
    }
  }, [isOpen, policy, term, availablePeriods]);

  // Load periods when dialog opens or scope changes (always needed now)
  useEffect(() => {
    if (!isOpen || !term) return;

    loadAvailablePeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.scopeType, formData.scopeIds, term]);

  const loadAvailablePeriods = async () => {
    if (!term) return;

    setIsLoadingPeriods(true);
    try {
      const configs = await fetchTimetableConfigs(term.id);

      // Resolve config based on scope
      const termConfig = configs.find((c) => c.scopeType === "TERM") || null;
      let gradeConfig = null;
      let sectionConfig = null;

      if ((formData.scopeType === "SECTION" || formData.scopeType === "CLASSROOM") && formData.scopeIds?.sectionId) {
        sectionConfig =
          configs.find(
            (c) =>
              c.scopeType === "SECTION" && c.scopeId === formData.scopeIds?.sectionId
          ) || null;
        gradeConfig =
          configs.find(
            (c) => c.scopeType === "GRADE" && c.scopeId === formData.scopeIds?.gradeId
          ) || null;
      } else if (formData.scopeType === "GRADE" && formData.scopeIds?.gradeId) {
        gradeConfig =
          configs.find(
            (c) => c.scopeType === "GRADE" && c.scopeId === formData.scopeIds?.gradeId
          ) || null;
      }

      const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
      setAvailablePeriods(resolved.periods);
    } catch (error) {
      console.error("Failed to load periods:", error);
      setAvailablePeriods([]);
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  const handleFieldChange = (
    field: keyof PolicyFormData,
    value: PolicyFormData[keyof PolicyFormData]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Step 1: Basic Info
      if (!formData.nameAr.trim()) {
        newErrors.nameAr = tValidation("nameArRequired");
      }
      if (!formData.nameEn.trim()) {
        newErrors.nameEn = tValidation("nameEnRequired");
      }

      // Check uniqueness
      if (formData.nameAr && formData.nameEn) {
        const { uniqueAr, uniqueEn } = isPolicyNameUnique(
          formData.yearId,
          formData.termId,
          formData.scopeType,
          formData.scopeIds,
          formData.nameAr,
          formData.nameEn,
          policy?.id
        );
        if (!uniqueAr) {
          newErrors.nameAr = tValidation("uniqueNameAr");
        }
        if (!uniqueEn) {
          newErrors.nameEn = tValidation("uniqueNameEn");
        }
      }
    } else if (step === 1) {
      // Step 2: Scope
      for (const field of getScopeSelectionMissingFields(formData.scopeType, formData.scopeIds)) {
        newErrors[field] = tValidation("required");
      }
    } else if (step === 2) {
      // Step 3: Period Selection (always required now)
      if (!formData.selectedPeriodIds || formData.selectedPeriodIds.length === 0) {
        newErrors.selectedPeriodIds = tValidation("periodsRequired");
      }
    } else if (step === 3) {
      // Step 4: Rules
      if (formData.lateThresholdMinutes < 0) {
        newErrors.lateThresholdMinutes = tValidation("nonNegative");
      }
      if (formData.earlyLeaveThresholdMinutes < 0) {
        newErrors.earlyLeaveThresholdMinutes = tValidation("nonNegative");
      }
      
      // Validate absentIfMissedPeriodsCount (required now)
      if (
        formData.absentIfMissedPeriodsCount === undefined ||
        formData.absentIfMissedPeriodsCount < 1
      ) {
        newErrors.absentIfMissedPeriodsCount = tValidation("thresholdRequired");
      } else if (
        formData.selectedPeriodIds &&
        formData.absentIfMissedPeriodsCount > formData.selectedPeriodIds.length
      ) {
        newErrors.absentIfMissedPeriodsCount = tValidation("thresholdOutOfRange", {
          max: formData.selectedPeriodIds.length,
        });
      }
      
    } else if (step === 4) {
      // Step 5: Dates & Review
      if (!formData.effectiveStartDate) {
        newErrors.effectiveStartDate = tValidation("required");
      }
      if (!formData.effectiveEndDate) {
        newErrors.effectiveEndDate = tValidation("required");
      }
      if (formData.effectiveStartDate && formData.effectiveEndDate) {
        if (formData.effectiveStartDate > formData.effectiveEndDate) {
          newErrors.effectiveEndDate = tValidation("startBeforeEnd");
        }

        // Check if dates are within term range
        if (term) {
          if (
            formData.effectiveStartDate < term.startDate ||
            formData.effectiveStartDate > term.endDate
          ) {
            newErrors.effectiveStartDate = tValidation("dateOutOfTerm");
          }
          if (
            formData.effectiveEndDate < term.startDate ||
            formData.effectiveEndDate > term.endDate
          ) {
            newErrors.effectiveEndDate = tValidation("dateOutOfTerm");
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error("Failed to save policy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    onClose();
  };

  const steps = [
    { title: t("steps.basicInfo.title"), subtitle: t("steps.basicInfo.subtitle") },
    { title: t("steps.scope.title"), subtitle: t("steps.scope.subtitle") },
    { title: t("steps.mode.title"), subtitle: t("steps.mode.subtitle") },
    { title: t("steps.rules.title"), subtitle: t("steps.rules.subtitle") },
    { title: t("steps.review.title"), subtitle: t("steps.review.subtitle") },
  ];

  const isEditing = !!policy;

  // Filtered grades and sections based on selection
  const filteredGrades = useMemo(() => {
    if (!formData.scopeIds?.stageId) return grades;
    return grades.filter((g) => g.stageId === formData.scopeIds?.stageId);
  }, [grades, formData.scopeIds?.stageId]);

  const filteredSections = useMemo(() => {
    if (!formData.scopeIds?.gradeId) return sections;
    return sections.filter((s) => s.gradeId === formData.scopeIds?.gradeId);
  }, [sections, formData.scopeIds?.gradeId]);

  const filteredClassrooms = useMemo(() => {
    if (!formData.scopeIds?.sectionId) return classrooms;
    return classrooms.filter((item) => item.sectionId === formData.scopeIds?.sectionId);
  }, [classrooms, formData.scopeIds?.sectionId]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditing ? t("editPolicy") : t("createPolicy")}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button onClick={handleClose} variant="ghost">
              {tCommon("cancel")}
            </Button>
            <div className="flex gap-2">
              {activeStep > 0 && (
                <Button onClick={handleBack} variant="secondary">
                  {t("back")}
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="primary">
                  {t("next")}
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isReadOnly || isSaving}
                  loading={isSaving}
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {tCommon("save")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto">
          {/* Stepper */}
          <WizardStepper steps={steps} activeStep={activeStep} locale={locale} />

          {/* Step Content */}
          <div className="min-h-[400px] py-6">
            {activeStep === 0 && (
              <Step1BasicInfo
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 1 && (
              <Step2Scope
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly}
                stages={stages}
                filteredGrades={filteredGrades}
                filteredSections={filteredSections}
                filteredClassrooms={filteredClassrooms}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 2 && (
              <Step3ModeComputation
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly}
                availablePeriods={availablePeriods}
                isLoadingPeriods={isLoadingPeriods}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 3 && (
              <Step4Rules
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 4 && (
              <Step5Review
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly}
                term={term}
                onFieldChange={handleFieldChange}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={handleDiscardChanges}
        title={t("unsavedChangesTitle")}
        description={t("unsavedChangesDesc")}
        confirmLabel={t("discard")}
        cancelLabel={t("stay")}
        severity="warning"
      />
    </>
  );
}

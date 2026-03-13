"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import ScopePicker from "./ScopePicker";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { isPolicyNameUnique } from "../services/attendancePolicyService";
import { getScopeSelectionMissingFields } from "@/features/attendance/shared/attendanceScope";
import type { AttendancePolicy, PolicyFormData, AttendanceMode } from "../types";
import type { Stage, Grade, Section, Classroom, Term } from "@/features/academics/academic-structure-tree/services/structureService";

interface PolicyEditorPanelProps {
  policy: AttendancePolicy | null;
  term: Term | null;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  onSave: (data: PolicyFormData) => Promise<void>;
  onCancel: () => void;
  onClose?: () => void;
}

export default function PolicyEditorPanel({
  policy,
  term,
  stages,
  grades,
  sections,
  classrooms,
  isReadOnly,
  onSave,
  onCancel,
  onClose,
}: PolicyEditorPanelProps) {
  const t = useTranslations("attendance.policies");
  const tForm = useTranslations("attendance.policies.form");
  const tValidation = useTranslations("attendance.policies.validation");

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (policy) {
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
        mode: policy.mode,
        dailyComputationStrategy: policy.dailyComputationStrategy || "MANUAL",
        selectedPeriodIds: policy.selectedPeriodIds || [],
        lateThresholdMinutes: policy.lateThresholdMinutes,
        earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes,
        autoAbsentAfterMinutes: policy.autoAbsentAfterMinutes,
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
      setErrors({});
    }
  }, [policy]);

  const handleFieldChange = (field: keyof PolicyFormData, value: PolicyFormData[keyof PolicyFormData]) => {
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Bilingual names
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

    for (const field of getScopeSelectionMissingFields(formData.scopeType, formData.scopeIds)) {
      newErrors[field] = tValidation("required");
    }

    // Numeric validations
    if (formData.lateThresholdMinutes < 0) {
      newErrors.lateThresholdMinutes = tValidation("nonNegative");
    }
    if (formData.earlyLeaveThresholdMinutes < 0) {
      newErrors.earlyLeaveThresholdMinutes = tValidation("nonNegative");
    }
    if (formData.autoAbsentAfterMinutes !== undefined && formData.autoAbsentAfterMinutes < 0) {
      newErrors.autoAbsentAfterMinutes = tValidation("nonNegative");
    }

    // Date validations
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
        if (formData.effectiveStartDate < term.startDate || formData.effectiveStartDate > term.endDate) {
          newErrors.effectiveStartDate = tValidation("dateOutOfTerm");
        }
        if (formData.effectiveEndDate < term.startDate || formData.effectiveEndDate > term.endDate) {
          newErrors.effectiveEndDate = tValidation("dateOutOfTerm");
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save policy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setPendingAction(() => onCancel);
      setShowUnsavedDialog(true);
    } else {
      onCancel();
    }
  };

  const handleClose = () => {
    if (isDirty && onClose) {
      setPendingAction(() => onClose);
      setShowUnsavedDialog(true);
    } else if (onClose) {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const isEditing = !!policy;

  return (
    <>
      <Modal
        isOpen={true}
        onClose={handleClose}
        title={isEditing ? t("editPolicy") : t("createPolicy")}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isReadOnly || isSaving || !isDirty}
              loading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t("save")}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Status Badge */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium">{t("status")}:</span>
              <span
                style={{
                  backgroundColor: formData.isActive ? "#dcfce7" : "var(--color-neutral-100)",
                  color: formData.isActive ? "#14532d" : "var(--color-neutral-800)",
                }}
                className="px-2 py-1 text-xs font-medium rounded"
              >
                {formData.isActive ? tForm("active") : tForm("inactive")}
              </span>
            </div>
          )}

          {/* Bilingual Name */}
          <BilingualTextField
            label={t("policyName")}
            value={{ ar: formData.nameAr, en: formData.nameEn }}
            onChange={(value) => {
              handleFieldChange("nameAr", value.ar);
              handleFieldChange("nameEn", value.en);
            }}
            requiredAr
            requiredEn
            disabled={isReadOnly}
            errors={{
              ar: errors.nameAr,
              en: errors.nameEn,
            }}
          />

          {/* Scope Picker */}
          <ScopePicker
            scopeType={formData.scopeType}
            scopeIds={formData.scopeIds || {}}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onScopeTypeChange={(scopeType) => handleFieldChange("scopeType", scopeType)}
            onScopeIdsChange={(scopeIds) => handleFieldChange("scopeIds", scopeIds)}
            disabled={isReadOnly}
            errors={errors}
          />

          {/* Mode */}
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {tForm("mode")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label style={{ borderColor: "var(--color-border)" }} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-neutral-50)]">
                <input
                  type="radio"
                  name="mode"
                  value="DAILY"
                  checked={formData.mode === "DAILY"}
                  onChange={(e) => handleFieldChange("mode", e.target.value as AttendanceMode)}
                  disabled={isReadOnly}
                  className="mt-1"
                />
                <div>
                  <div style={{ color: "var(--color-gray-900)" }} className="font-medium">{tForm("daily")}</div>
                  <div style={{ color: "var(--color-neutral-500)" }} className="text-sm">{tForm("dailyDesc")}</div>
                </div>
              </label>
              <label style={{ borderColor: "var(--color-border)" }} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-neutral-50)]">
                <input
                  type="radio"
                  name="mode"
                  value="PERIOD"
                  checked={formData.mode === "PERIOD"}
                  onChange={(e) => handleFieldChange("mode", e.target.value as AttendanceMode)}
                  disabled={isReadOnly}
                  className="mt-1"
                />
                <div>
                  <div style={{ color: "var(--color-gray-900)" }} className="font-medium">{tForm("period")}</div>
                  <div style={{ color: "var(--color-neutral-500)" }} className="text-sm">{tForm("periodDesc")}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Numeric Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {tForm("lateThreshold")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.lateThresholdMinutes}
                  onChange={(e) => handleFieldChange("lateThresholdMinutes", parseInt(e.target.value) || 0)}
                  min={0}
                  disabled={isReadOnly}
                  error={errors.lateThresholdMinutes}
                />
                <span style={{ color: "var(--color-neutral-500)" }} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {tForm("minutes")}
                </span>
              </div>
            </div>
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {tForm("earlyThreshold")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.earlyLeaveThresholdMinutes}
                  onChange={(e) => handleFieldChange("earlyLeaveThresholdMinutes", parseInt(e.target.value) || 0)}
                  min={0}
                  disabled={isReadOnly}
                  error={errors.earlyLeaveThresholdMinutes}
                />
                <span style={{ color: "var(--color-neutral-500)" }} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {tForm("minutes")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
              {tForm("autoAbsentAfter")}
            </label>
            <div className="relative">
              <Input
                type="number"
                value={formData.autoAbsentAfterMinutes || ""}
                onChange={(e) => handleFieldChange("autoAbsentAfterMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
                min={0}
                disabled={isReadOnly}
                error={errors.autoAbsentAfterMinutes}
                placeholder={tForm("optional")}
              />
              <span style={{ color: "var(--color-neutral-500)" }} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                {tForm("minutes")}
              </span>
            </div>
            <p style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-1">{tForm("autoAbsentAfterDesc")}</p>
          </div>

          {/* Excuses */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.allowExcuses}
                onChange={(e) => handleFieldChange("allowExcuses", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium">{tForm("allowExcuses")}</span>
            </label>
            
            {formData.allowExcuses && (
              <label className="flex items-center gap-3 ml-7">
                <input
                  type="checkbox"
                  checked={formData.requireAttachmentForExcuse}
                  onChange={(e) => handleFieldChange("requireAttachmentForExcuse", e.target.checked)}
                  disabled={isReadOnly}
                  className="w-4 h-4"
                />
                <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{tForm("requireAttachment")}</span>
              </label>
            )}
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {tForm("effectiveStart")} <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.effectiveStartDate ? new Date(formData.effectiveStartDate) : undefined}
                onChange={(value) => handleFieldChange("effectiveStartDate", value ? value.toISOString().split('T')[0] : "")}
                disabled={isReadOnly}
                error={errors.effectiveStartDate}
              />
            </div>
            <div>
              <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
                {tForm("effectiveEnd")} <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.effectiveEndDate ? new Date(formData.effectiveEndDate) : undefined}
                onChange={(value) => handleFieldChange("effectiveEndDate", value ? value.toISOString().split('T')[0] : "")}
                disabled={isReadOnly}
                error={errors.effectiveEndDate}
              />
            </div>
          </div>
          {term && (
            <p style={{ color: "var(--color-neutral-500)" }} className="text-xs">
              {tForm("termRangeHint", { start: term.startDate, end: term.endDate })}
            </p>
          )}

          {/* Active Status */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleFieldChange("isActive", e.target.checked)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
            <span style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium">{tForm("isActive")}</span>
          </label>
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

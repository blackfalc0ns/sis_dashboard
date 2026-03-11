"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { getUploadRules } from "@/utils/upload/validateFile";
import { fetchRoster } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { ExcuseRequest, ExcuseScopeType, ExcuseType, AttachmentMeta } from "../types";
import type { EffectiveExcusePolicy } from "@/features/attendance/policies/services/attendancePolicyService";
import { formatLocalDate } from "../../utils/dateFormatting";
import { normalizeSelectedPeriodIds } from "../../utils/periodIdNormalization";

interface ExcuseRequestModalProps {
  isOpen: boolean;
  isReadOnly: boolean;
  termId: string;
  termRange: { startDate: string; endDate: string };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  effectivePolicy: EffectiveExcusePolicy | null;
  initialRequest?: ExcuseRequest | null;
  onClose: () => void;
  onSave: (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => Promise<void>;
}

interface FormState {
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  scopeType: ExcuseScopeType;
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string };
  type: ExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds: string[];
  reasonAr: string;
  reasonEn: string;
  attachments: AttachmentMeta[];
}

interface RosterStudent {
  id: string;
  nameAr: string;
  nameEn: string;
  studentNumber: string;
}

export default function ExcuseRequestModal({
  isOpen,
  isReadOnly,
  termId,
  termRange,
  stages,
  grades,
  sections,
  effectivePolicy,
  initialRequest,
  onClose,
  onSave,
}: ExcuseRequestModalProps) {
  const t = useTranslations("attendance.excuses.modal");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const locale = useLocale();

  const [form, setForm] = useState<FormState>({
    studentId: "",
    studentNameAr: "",
    studentNameEn: "",
    studentNumber: "",
    scopeType: "SCHOOL",
    scopeIds: {},
    type: "ABSENCE",
    dateFrom: "",
    dateTo: "",
    selectedPeriodIds: [],
    reasonAr: "",
    reasonEn: "",
    attachments: [],
  });

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rules = getUploadRules("ATTENDANCE_EXCUSE");
  const requireAttachment = effectivePolicy?.requireAttachmentForExcuse ?? false;
  const allowExcuses = effectivePolicy?.allowExcuses ?? true;

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialRequest) {
      // Editing existing request
      setForm({
        studentId: initialRequest.studentId,
        studentNameAr: initialRequest.studentNameAr,
        studentNameEn: initialRequest.studentNameEn,
        studentNumber: initialRequest.studentNumber,
        scopeType: initialRequest.scopeType,
        scopeIds: initialRequest.scopeIds,
        type: initialRequest.type,
        dateFrom: initialRequest.dateFrom,
        dateTo: initialRequest.dateTo,
        selectedPeriodIds: initialRequest.selectedPeriodIds || [],
        reasonAr: initialRequest.reasonAr,
        reasonEn: initialRequest.reasonEn,
        attachments: initialRequest.attachments,
      });
    } else {
      // Creating new request
      setForm({
        studentId: "",
        studentNameAr: "",
        studentNameEn: "",
        studentNumber: "",
        scopeType: "SCHOOL",
        scopeIds: {},
        type: "ABSENCE",
        dateFrom: termRange.startDate,
        dateTo: termRange.startDate,
        selectedPeriodIds: [],
        reasonAr: "",
        reasonEn: "",
        attachments: [],
      });
    }

    setErrors({});
    setRosterError(false);
  }, [isOpen, initialRequest, termRange.startDate]);

  // Load roster when scope changes
  useEffect(() => {
    if (!isOpen) return;

    const loadRoster = async () => {
      setRosterLoading(true);
      setRosterError(false);
      try {
        const students = await fetchRoster(form.scopeType, form.scopeIds || {});
        setRoster(students);
      } catch (error) {
        console.error("Failed to load roster:", error);
        setRosterError(true);
        setRoster([]);
      } finally {
        setRosterLoading(false);
      }
    };

    loadRoster();
  }, [isOpen, form.scopeType, form.scopeIds]);

  // Load timetable periods for scope
  useEffect(() => {
    if (!isOpen) return;

    const loadPeriods = async () => {
      try {
        const termConfig = await fetchTimetableConfig(termId, "TERM");
        
        let gradeConfig = null;
        if (form.scopeIds?.gradeId) {
          gradeConfig = await fetchTimetableConfig(termId, "GRADE", form.scopeIds.gradeId);
        }
        
        let sectionConfig = null;
        if (form.scopeIds?.sectionId) {
          sectionConfig = await fetchTimetableConfig(termId, "SECTION", form.scopeIds.sectionId);
        }

        const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
        setPeriods(resolved.periods);
      } catch (error) {
        console.error("Failed to load periods:", error);
        setPeriods([]);
      }
    };

    loadPeriods();
  }, [isOpen, termId, form.scopeIds]);

  // Student options with locale-aware rendering
  const studentOptions = useMemo(
    () =>
      roster.map((student) => ({
        value: student.id,
        label: locale === "ar" 
          ? `${student.nameAr} (${student.studentNumber})`
          : `${student.nameEn} (${student.studentNumber})`,
      })),
    [roster, locale]
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.studentId) nextErrors.studentId = t("validation.studentRequired");
    if (!form.dateFrom) nextErrors.dateFrom = t("validation.dateRequired");
    if (!form.dateTo) nextErrors.dateTo = t("validation.dateRequired");
    if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) nextErrors.dateTo = t("validation.dateOrder");
    if (form.dateFrom && (form.dateFrom < termRange.startDate || form.dateFrom > termRange.endDate)) nextErrors.dateFrom = t("validation.termRange");
    if (form.dateTo && (form.dateTo < termRange.startDate || form.dateTo > termRange.endDate)) nextErrors.dateTo = t("validation.termRange");
    if (!form.reasonAr.trim() && !form.reasonEn.trim()) nextErrors.reason = t("validation.reasonRequired");
    
    // Period validation for LATE/EARLY_LEAVE
    if ((form.type === "LATE" || form.type === "EARLY_LEAVE") && form.selectedPeriodIds.length === 0) {
      nextErrors.periods = t("validation.periodRequired");
    }

    // Policy-based validation
    if (!allowExcuses) {
      nextErrors.policy = t("validation.policyDisabled");
    }

    if (requireAttachment && form.attachments.length === 0) {
      nextErrors.attachments = t("validation.attachmentRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFilesSelected = (files: File[]) => {
    if (isReadOnly) return;

    const mapped = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...mapped] }));
    setErrors((prev) => ({ ...prev, attachments: "" }));
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    if (isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att.id !== attachmentId),
    }));
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      
      // Normalize selected period IDs before saving
      const normalizedPeriodIds = normalizeSelectedPeriodIds(form.selectedPeriodIds, periods);

      await onSave({
        studentId: form.studentId,
        studentNameAr: form.studentNameAr,
        studentNameEn: form.studentNameEn,
        studentNumber: form.studentNumber,
        scopeType: form.scopeType,
        scopeIds: form.scopeIds,
        type: form.type,
        dateFrom: form.dateFrom,
        dateTo: form.type === "LATE" || form.type === "EARLY_LEAVE" ? form.dateFrom : form.dateTo,
        selectedPeriodIds: form.type === "ABSENCE" ? [] : normalizedPeriodIds,
        reasonAr: form.reasonAr,
        reasonEn: form.reasonEn,
        attachments: form.attachments,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleScopeChange = (scopeType: ExcuseScopeType, scopeIds: { stageId?: string; gradeId?: string; sectionId?: string }) => {
    if (isReadOnly) return;
    
    // Reset all student-related state when scope changes
    setForm((prev) => ({
      ...prev,
      scopeType,
      scopeIds,
      studentId: "",
      studentNameAr: "",
      studentNameEn: "",
      studentNumber: "",
    }));
  };

  const handleTypeChange = (type: ExcuseType) => {
    if (isReadOnly) return;

    setForm((prev) => ({
      ...prev,
      type,
      // For LATE/EARLY_LEAVE, ensure dateTo matches dateFrom (single date)
      dateTo: (type === "LATE" || type === "EARLY_LEAVE") ? prev.dateFrom : prev.dateTo,
      // Clear period selection when changing type
      selectedPeriodIds: [],
    }));
  };

  const handleDateFromChange = (date: Date | null) => {
    if (isReadOnly) return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => ({
      ...prev,
      dateFrom: dateStr,
      // For LATE/EARLY_LEAVE, dateTo must match dateFrom
      dateTo: (prev.type === "LATE" || prev.type === "EARLY_LEAVE") ? dateStr : prev.dateTo,
    }));
    setErrors((prev) => ({ ...prev, dateFrom: "", dateTo: "" }));
  };

  const handleDateToChange = (date: Date | null) => {
    if (isReadOnly) return;
    
    // Only allow dateTo change for ABSENCE
    if (form.type === "LATE" || form.type === "EARLY_LEAVE") return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => ({ ...prev, dateTo: dateStr }));
    setErrors((prev) => ({ ...prev, dateTo: "" }));
  };

  const handlePeriodToggle = (periodId: string) => {
    if (isReadOnly) return;

    setForm((prev) => ({
      ...prev,
      selectedPeriodIds: prev.selectedPeriodIds.includes(periodId)
        ? prev.selectedPeriodIds.filter((id) => id !== periodId)
        : [...prev.selectedPeriodIds, periodId],
    }));
    setErrors((prev) => ({ ...prev, periods: "" }));
  };

  const isSingleDateType = form.type === "LATE" || form.type === "EARLY_LEAVE";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRequest ? t("editTitle") : t("createTitle")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          {!isReadOnly && (
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={!allowExcuses}>
              {tCommon("save")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {/* Policy warning */}
        {!allowExcuses && (
          <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: "var(--color-warning-50)", borderLeft: "3px solid var(--color-warning-500)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-warning-700)" }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-warning-800)" }}>
                {t("validation.policyDisabled")}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                {t("messages.excusesDisabledByPolicy")}
              </p>
            </div>
          </div>
        )}

        {/* Scope Picker */}
        <ScopePicker
          scopeType={form.scopeType}
          scopeIds={form.scopeIds || {}}
          stages={stages}
          grades={grades}
          sections={sections}
          onScopeTypeChange={(scopeType) => handleScopeChange(scopeType, {})}
          onScopeIdsChange={(scopeIds) => handleScopeChange(form.scopeType, scopeIds)}
          errors={{}}
          disabled={isReadOnly}
        />

        {/* Student Selection */}
        {rosterLoading ? (
          <div className="flex items-center justify-center py-4">
            <PartialLoader />
          </div>
        ) : rosterError ? (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-accent-50)", color: "var(--color-accent-700)" }}>
            <p className="text-sm">{t("rosterLoadError")}</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-info-50)", color: "var(--color-info-700)" }}>
            <p className="text-sm">{t("noStudentsInScope")}</p>
          </div>
        ) : (
          <Select
            label={t("student")}
            value={form.studentId}
            onChange={(studentId) => {
              if (isReadOnly) return;
              const selected = roster.find((item) => item.id === studentId);
              setForm((prev) => ({
                ...prev,
                studentId,
                studentNameAr: selected?.nameAr || "",
                studentNameEn: selected?.nameEn || "",
                studentNumber: selected?.studentNumber || "",
              }));
              setErrors((prev) => ({ ...prev, studentId: "" }));
            }}
            options={studentOptions}
            error={errors.studentId}
            disabled={isReadOnly}
          />
        )}

        {/* Type Selection */}
        <Select
          label={t("type")}
          value={form.type}
          onChange={(value) => handleTypeChange(value as ExcuseType)}
          options={[
            { value: "ABSENCE", label: t("absence") },
            { value: "LATE", label: t("late") },
            { value: "EARLY_LEAVE", label: t("earlyLeave") },
          ]}
          disabled={isReadOnly}
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DatePicker
            label={isSingleDateType ? t("date") : t("dateFrom")}
            value={form.dateFrom ? new Date(form.dateFrom + "T00:00:00") : null}
            onChange={handleDateFromChange}
            minDate={new Date(termRange.startDate + "T00:00:00")}
            maxDate={new Date(termRange.endDate + "T00:00:00")}
            error={errors.dateFrom}
            disabled={isReadOnly}
          />
          {!isSingleDateType && (
            <DatePicker
              label={t("dateTo")}
              value={form.dateTo ? new Date(form.dateTo + "T00:00:00") : null}
              onChange={handleDateToChange}
              minDate={new Date(termRange.startDate + "T00:00:00")}
              maxDate={new Date(termRange.endDate + "T00:00:00")}
              error={errors.dateTo}
              disabled={isReadOnly}
            />
          )}
        </div>

        {/* Period Selection for LATE/EARLY_LEAVE */}
        {form.type !== "ABSENCE" && periods.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              {t("periods")} {form.type === "LATE" || form.type === "EARLY_LEAVE" ? "*" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => {
                const checked = form.selectedPeriodIds.includes(period.id);
                return (
                  <label
                    key={period.id}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                      isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      borderColor: checked ? "var(--color-primary-500)" : "var(--border-color)",
                      backgroundColor: checked ? "var(--color-primary-50)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePeriodToggle(period.id)}
                      disabled={isReadOnly}
                      className="cursor-pointer"
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {locale === "ar" ? period.nameAr : period.nameEn}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.periods && (
              <p className="text-xs mt-1" style={{ color: "var(--color-accent-700)" }}>
                {errors.periods}
              </p>
            )}
            {form.type === "LATE" || form.type === "EARLY_LEAVE" ? (
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                {t("periodRequiredHelp")}
              </p>
            ) : null}
          </div>
        )}

        {/* Absence helper text */}
        {form.type === "ABSENCE" && (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-info-50)" }}>
            <p className="text-xs" style={{ color: "var(--color-info-700)" }}>
              {t("absenceAppliesToPolicyPeriods")}
            </p>
          </div>
        )}

        {/* Reason */}
        <div>
          <BilingualTextField
            label={t("reason")}
            value={{ ar: form.reasonAr, en: form.reasonEn }}
            onChange={(value) => {
              if (isReadOnly) return;
              setForm((prev) => ({ ...prev, reasonAr: value.ar, reasonEn: value.en }));
              setErrors((prev) => ({ ...prev, reason: "" }));
            }}
            requiredAr={false}
            requiredEn={false}
            errors={{ ar: errors.reason, en: errors.reason }}
            disabled={isReadOnly}
          />
        </div>

        {/* Attachments */}
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            {t("attachments")} {requireAttachment ? "*" : ""}
          </p>
          {!isReadOnly && (
            <DragDropUploadArea
              uploadArea="ATTENDANCE_EXCUSE"
              onFilesSelected={handleFilesSelected}
              helperText={`${tUpload(rules.acceptLabelKey)} - ${Math.round(rules.maxSizeBytes / (1024 * 1024))}MB`}
            />
          )}
          {errors.attachments && (
            <p className="text-xs mt-1" style={{ color: "var(--color-accent-700)" }}>
              {errors.attachments}
            </p>
          )}
          {requireAttachment && (
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {t("attachmentRequiredByPolicy")}
            </p>
          )}
          {form.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {form.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 rounded border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {attachment.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-1 rounded ml-2"
                      style={{ color: "var(--color-accent-700)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

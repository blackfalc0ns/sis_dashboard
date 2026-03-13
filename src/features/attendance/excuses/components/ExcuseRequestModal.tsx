"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, X, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
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
import type { Classroom, Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { ExcuseRequest, ExcuseScopeType, ExcuseType, AttachmentMeta } from "../types";
import { formatLocalDate } from "../../utils/dateFormatting";
import { normalizeSelectedPeriodIds } from "../../utils/periodIdNormalization";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";
import {
  resolveEffectiveExcusePolicy,
  type EffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import { validateExcusePolicyRange } from "../services/attendanceExcusesService";
import type { ExcusePolicyIssue } from "../utils/excusePolicyValidation";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

interface ExcuseRequestModalProps {
  isOpen: boolean;
  isReadOnly: boolean;
  yearId: string;
  termId: string;
  termRange: { startDate: string; endDate: string };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
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
  scopeIds?: AttendanceScopeIds;
  type: ExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds: string[];
  minutesLate?: number;
  minutesEarlyLeave?: number;
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
  yearId,
  termId,
  termRange,
  stages,
  grades,
  sections,
  classrooms,
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
  const [resolvedPolicy, setResolvedPolicy] = useState<EffectiveExcusePolicy | null>(null);
  const [policyIssue, setPolicyIssue] = useState<ExcusePolicyIssue | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  const rules = getUploadRules("ATTENDANCE_EXCUSE");
  const requireReason = resolvedPolicy?.requireExcuseReason ?? false;
  const requireAttachment = resolvedPolicy?.requireAttachmentForExcuse ?? false;
  const allowExcuses = resolvedPolicy?.allowExcuses ?? false;
  const lateThresholdState = getThresholdState("LATE", form.minutesLate, resolvedPolicy);
  const earlyLeaveThresholdState = getThresholdState("EARLY_LEAVE", form.minutesEarlyLeave, resolvedPolicy);
  const isPolicyBlocking = !!policyIssue || !allowExcuses;

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
        minutesLate: initialRequest.minutesLate,
        minutesEarlyLeave: initialRequest.minutesEarlyLeave,
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
        minutesLate: undefined,
        minutesEarlyLeave: undefined,
        reasonAr: "",
        reasonEn: "",
        attachments: [],
      });
    }

    setErrors({});
    setRosterError(false);
    setPolicyIssue(null);
  }, [isOpen, initialRequest, termRange.startDate]);

  useEffect(() => {
    if (!isOpen || !yearId || !termId || !form.dateFrom) return;

    let cancelled = false;

    const loadPolicyState = async () => {
      try {
        setPolicyLoading(true);

        const [policy, issue] = await Promise.all([
          resolveEffectiveExcusePolicy(yearId, termId, form.scopeType, form.scopeIds, form.dateFrom),
          validateExcusePolicyRange({
            yearId,
            termId,
            dateFrom: form.dateFrom,
            dateTo: form.type === "LATE" || form.type === "EARLY_LEAVE" ? form.dateFrom : form.dateTo || form.dateFrom,
            scopeType: form.scopeType,
            scopeIds: form.scopeIds,
            attachments: form.attachments,
            reasonAr: form.reasonAr,
            reasonEn: form.reasonEn,
          }),
        ]);

        if (!cancelled) {
          setResolvedPolicy(policy);
          setPolicyIssue(issue);
        }
      } catch (error) {
        console.error("Failed to resolve excuse policy state:", error);
        if (!cancelled) {
          setResolvedPolicy(null);
          setPolicyIssue({ code: "NO_ACTIVE_POLICY", date: form.dateFrom });
        }
      } finally {
        if (!cancelled) {
          setPolicyLoading(false);
        }
      }
    };

    loadPolicyState();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    yearId,
    termId,
    form.scopeType,
    form.scopeIds,
    form.dateFrom,
    form.dateTo,
    form.type,
    form.reasonAr,
    form.reasonEn,
    form.attachments,
  ]);

  const getPolicyIssueMessage = (issue: ExcusePolicyIssue | null) => {
    if (!issue) return "";
    if (issue.code === "NO_ACTIVE_POLICY") return t("messages.noActivePolicyOnDate", { date: issue.date });
    if (issue.code === "REASON_REQUIRED") return t("messages.reasonRequiredOnDate", { date: issue.date });
    if (issue.code === "ATTACHMENT_REQUIRED") return t("messages.attachmentRequiredOnDate", { date: issue.date });
    return t("messages.excusesDisabledOnDate", { date: issue.date });
  };

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
        searchText: [student.nameAr, student.nameEn, student.studentNumber]
          .filter(Boolean)
          .join(" "),
      })),
    [roster, locale]
  );

  const validateDateFields = (dateFrom: string, dateTo: string) => {
    const nextDateErrors: Record<string, string> = {};

    if (!dateFrom) {
      nextDateErrors.dateFrom = t("validation.dateRequired");
    } else if (dateFrom < termRange.startDate || dateFrom > termRange.endDate) {
      nextDateErrors.dateFrom = t("validation.termRange");
    }

    if (!dateTo) {
      nextDateErrors.dateTo = t("validation.dateRequired");
    } else if (dateTo < termRange.startDate || dateTo > termRange.endDate) {
      nextDateErrors.dateTo = t("validation.termRange");
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      nextDateErrors.dateTo = t("validation.dateOrder");
    }

    setErrors((prev) => ({
      ...prev,
      dateFrom: nextDateErrors.dateFrom || "",
      dateTo: nextDateErrors.dateTo || "",
    }));

    return nextDateErrors;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.studentId) nextErrors.studentId = t("validation.studentRequired");
    Object.assign(nextErrors, validateDateFields(form.dateFrom, form.dateTo));
    if ((policyIssue?.code === "REASON_REQUIRED" || requireReason) && !form.reasonAr.trim() && !form.reasonEn.trim()) {
      nextErrors.reason = t("validation.reasonRequired");
    }
    
    // Period validation for LATE/EARLY_LEAVE
    if ((form.type === "LATE" || form.type === "EARLY_LEAVE") && form.selectedPeriodIds.length === 0) {
      nextErrors.periods = t("validation.periodRequired");
    }

    // Minutes validation for LATE
    if (form.type === "LATE") {
      if (form.minutesLate === undefined || form.minutesLate === null || form.minutesLate === 0) {
        nextErrors.minutesLate = t("validation.minutesRequired");
      } else if (form.minutesLate <= 0) {
        nextErrors.minutesLate = t("validation.minutesPositive");
      }
    }

    // Minutes validation for EARLY_LEAVE
    if (form.type === "EARLY_LEAVE") {
      if (form.minutesEarlyLeave === undefined || form.minutesEarlyLeave === null || form.minutesEarlyLeave === 0) {
        nextErrors.minutesEarlyLeave = t("validation.minutesRequired");
      } else if (form.minutesEarlyLeave <= 0) {
        nextErrors.minutesEarlyLeave = t("validation.minutesPositive");
      }
    }

    // Policy-based validation
    if (policyIssue?.code === "EXCUSES_DISABLED") {
      nextErrors.policy = t("validation.policyDisabled");
    }

    if (policyIssue?.code === "REASON_REQUIRED") {
      nextErrors.reason = t("validation.reasonRequired");
    }

    if (policyIssue?.code === "ATTACHMENT_REQUIRED" || (requireAttachment && form.attachments.length === 0)) {
      nextErrors.attachments = t("validation.attachmentRequired");
    }

    if (policyIssue?.code === "NO_ACTIVE_POLICY") {
      nextErrors.policy = t("validation.noActivePolicy");
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
      url: URL.createObjectURL(file),
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
        minutesLate: form.type === "LATE" ? form.minutesLate : undefined,
        minutesEarlyLeave: form.type === "EARLY_LEAVE" ? form.minutesEarlyLeave : undefined,
        reasonAr: form.reasonAr,
        reasonEn: form.reasonEn,
        attachments: form.attachments,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleScopeChange = (scopeType: ExcuseScopeType, scopeIds: AttendanceScopeIds) => {
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
      // Clear minutes when changing type
      minutesLate: type === "LATE" ? prev.minutesLate : undefined,
      minutesEarlyLeave: type === "EARLY_LEAVE" ? prev.minutesEarlyLeave : undefined,
    }));
  };

  const handleDateFromChange = (date: Date | null) => {
    if (isReadOnly) return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => {
      const nextDateTo = (prev.type === "LATE" || prev.type === "EARLY_LEAVE") ? dateStr : prev.dateTo;
      validateDateFields(dateStr, nextDateTo);
      return {
      ...prev,
      dateFrom: dateStr,
      // For LATE/EARLY_LEAVE, dateTo must match dateFrom
      dateTo: nextDateTo,
    };
    });
  };

  const handleDateToChange = (date: Date | null) => {
    if (isReadOnly) return;
    
    // Only allow dateTo change for ABSENCE
    if (form.type === "LATE" || form.type === "EARLY_LEAVE") return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => {
      validateDateFields(prev.dateFrom, dateStr);
      return { ...prev, dateTo: dateStr };
    });
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
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={policyLoading || isPolicyBlocking}>
              {tCommon("save")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {/* Policy warning */}
        {(policyLoading || policyIssue || resolvedPolicy) && (
          <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: "var(--color-warning-50)", borderLeft: "3px solid var(--color-warning-500)" }}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-warning-700)" }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-warning-800)" }}>
                {policyLoading
                  ? t("policy.loading")
                  : policyIssue
                    ? t("policy.actionBlocked")
                    : t("policy.active")}
              </p>
              {policyLoading ? null : (
                <>
                  <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                    {policyIssue ? getPolicyIssueMessage(policyIssue) : t("policy.summary")}
                  </p>
                  {resolvedPolicy?.requireAttachmentForExcuse && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                      {t("policy.attachmentRequired")}
                    </p>
                  )}
                  {resolvedPolicy?.requireExcuseReason && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                      {t("policy.reasonRequired")}
                    </p>
                  )}
                </>
              )}
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
          classrooms={classrooms}
          onScopeTypeChange={(scopeType) => handleScopeChange(scopeType, {})}
          onScopeIdsChange={(scopeIds) =>
            setForm((prev) => ({
              ...prev,
              scopeIds,
              studentId: "",
              studentNameAr: "",
              studentNameEn: "",
              studentNumber: "",
            }))
          }
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
            placeholder={t("selectStudent")}
            error={errors.studentId}
            disabled={isReadOnly}
            searchable={true}
            searchPlaceholder={t("searchStudent")}
            noResultsText={t("noStudentsFound")}
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

        {/* Minutes field for LATE */}
        {form.type === "LATE" && (
          <div>
            <Input
              label={t("minutesLate")}
              type="number"
              value={form.minutesLate?.toString() || ""}
              onChange={(e) => {
                if (isReadOnly) return;
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setForm((prev) => ({ ...prev, minutesLate: value }));
                setErrors((prev) => ({ ...prev, minutesLate: "" }));
              }}
              error={errors.minutesLate}
              disabled={isReadOnly}
              min={1}
              placeholder="0"
              helperText={t("minutesLateHelper")}
            />
            {lateThresholdState.isReached && typeof lateThresholdState.threshold === "number" && (
              <div className="flex items-start gap-2 mt-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent-700)" }} />
                <p className="text-xs" style={{ color: "var(--color-accent-700)" }}>
                  {t("thresholdReached", { threshold: lateThresholdState.threshold })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Minutes field for EARLY_LEAVE */}
        {form.type === "EARLY_LEAVE" && (
          <div>
            <Input
              label={t("minutesEarlyLeave")}
              type="number"
              value={form.minutesEarlyLeave?.toString() || ""}
              onChange={(e) => {
                if (isReadOnly) return;
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setForm((prev) => ({ ...prev, minutesEarlyLeave: value }));
                setErrors((prev) => ({ ...prev, minutesEarlyLeave: "" }));
              }}
              error={errors.minutesEarlyLeave}
              disabled={isReadOnly}
              min={1}
              placeholder="0"
              helperText={t("minutesEarlyLeaveHelper")}
            />
            {earlyLeaveThresholdState.isReached && typeof earlyLeaveThresholdState.threshold === "number" && (
              <div className="flex items-start gap-2 mt-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent-700)" }} />
                <p className="text-xs" style={{ color: "var(--color-accent-700)" }}>
                  {t("thresholdReached", { threshold: earlyLeaveThresholdState.threshold })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            {t("reason")} {requireReason ? "*" : ""}
          </p>
          <BilingualTextField
            label=""
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
          {requireReason && (
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {t("reasonRequiredByPolicy")}
            </p>
          )}
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

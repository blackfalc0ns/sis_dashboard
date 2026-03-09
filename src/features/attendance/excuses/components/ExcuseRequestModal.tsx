"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import { getUploadRules } from "@/utils/upload/validateFile";
import { fetchRoster } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import type { Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { ExcuseRequest, ExcuseScopeType, ExcuseType, AttachmentMeta } from "../types";

interface ExcuseRequestModalProps {
  isOpen: boolean;
  isReadOnly: boolean;
  termRange: { startDate: string; endDate: string };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  periods: Array<{ index: number; nameAr: string; nameEn: string }>;
  requireAttachment: boolean;
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
  periodIndexes: number[];
  reasonAr: string;
  reasonEn: string;
  attachments: AttachmentMeta[];
}

export default function ExcuseRequestModal({
  isOpen,
  isReadOnly,
  termRange,
  stages,
  grades,
  sections,
  periods,
  requireAttachment,
  initialRequest,
  onClose,
  onSave,
}: ExcuseRequestModalProps) {
  const t = useTranslations("attendance.excuses.modal");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");

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
    periodIndexes: [],
    reasonAr: "",
    reasonEn: "",
    attachments: [],
  });
  const [roster, setRoster] = useState<Array<{ id: string; nameAr: string; nameEn: string; studentNumber: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialRequest) {
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
        periodIndexes: initialRequest.periodIndexes || [],
        reasonAr: initialRequest.reasonAr,
        reasonEn: initialRequest.reasonEn,
        attachments: initialRequest.attachments,
      });
    } else {
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
        periodIndexes: [],
        reasonAr: "",
        reasonEn: "",
        attachments: [],
      });
    }

    setErrors({});
  }, [isOpen, initialRequest, termRange.startDate]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRoster = async () => {
      const students = await fetchRoster(form.scopeType, form.scopeIds || {});
      setRoster(students);
    };

    loadRoster();
  }, [isOpen, form.scopeType, form.scopeIds]);

  const rules = getUploadRules("ATTENDANCE_EXCUSE");

  const studentOptions = useMemo(
    () =>
      roster.map((student) => ({
        value: student.id,
        label: `${student.nameEn} / ${student.nameAr} (${student.studentNumber})`,
      })),
    [roster]
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
    if (requireAttachment && form.attachments.length === 0) nextErrors.attachments = t("validation.attachmentRequired");

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFilesSelected = (files: File[]) => {
    const mapped = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...mapped] }));
    setErrors((prev) => ({ ...prev, attachments: "" }));
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      await onSave({        studentId: form.studentId,
        studentNameAr: form.studentNameAr,
        studentNameEn: form.studentNameEn,
        studentNumber: form.studentNumber,
        scopeType: form.scopeType,
        scopeIds: form.scopeIds,
        type: form.type,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        periodIndexes: form.type === "ABSENCE" ? [] : form.periodIndexes,
        reasonAr: form.reasonAr,
        reasonEn: form.reasonEn,
        attachments: form.attachments,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRequest ? t("editTitle") : t("createTitle")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>{tCommon("cancel")}</Button>
          {!isReadOnly && <Button variant="primary" onClick={handleSave} loading={saving}>{tCommon("save")}</Button>}
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <ScopePicker
          scopeType={form.scopeType}
          scopeIds={form.scopeIds || {}}
          stages={stages}
          grades={grades}
          sections={sections}
          onScopeTypeChange={(scopeType) => setForm((prev) => ({ ...prev, scopeType, scopeIds: {}, studentId: "" }))}
          onScopeIdsChange={(scopeIds) => setForm((prev) => ({ ...prev, scopeIds, studentId: "" }))}
          errors={{}}
        />

        <Select
          label={t("student")}
          value={form.studentId}
          onChange={(studentId) => {
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
        />

        <Select
          label={t("type")}
          value={form.type}
          onChange={(value) => setForm((prev) => ({ ...prev, type: value as ExcuseType, periodIndexes: [] }))}
          options={[
            { value: "ABSENCE", label: t("absence") },
            { value: "LATE", label: t("late") },
            { value: "EARLY_LEAVE", label: t("earlyLeave") },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DatePicker
            label={t("dateFrom")}
            value={form.dateFrom ? new Date(form.dateFrom) : null}
            onChange={(value) => setForm((prev) => ({ ...prev, dateFrom: value ? value.toISOString().split("T")[0] : "" }))}
            minDate={new Date(termRange.startDate)}
            maxDate={new Date(termRange.endDate)}
            error={errors.dateFrom}
          />
          <DatePicker
            label={t("dateTo")}
            value={form.dateTo ? new Date(form.dateTo) : null}
            onChange={(value) => setForm((prev) => ({ ...prev, dateTo: value ? value.toISOString().split("T")[0] : "" }))}
            minDate={new Date(termRange.startDate)}
            maxDate={new Date(termRange.endDate)}
            error={errors.dateTo}
          />
        </div>

        {form.type !== "ABSENCE" && periods.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{t("periods")}</p>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => {
                const checked = form.periodIndexes.includes(period.index);
                return (
                  <label key={period.index} className="inline-flex items-center gap-2 px-2 py-1 rounded border" style={{ borderColor: "var(--border-color)" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          periodIndexes: event.target.checked
                            ? [...prev.periodIndexes, period.index]
                            : prev.periodIndexes.filter((index) => index !== period.index),
                        }));
                      }}
                    />
                    <span className="text-sm">{period.nameEn}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <BilingualTextField
            label={t("reason")}
            value={{ ar: form.reasonAr, en: form.reasonEn }}
            onChange={(value) => {
              setForm((prev) => ({ ...prev, reasonAr: value.ar, reasonEn: value.en }));
              setErrors((prev) => ({ ...prev, reason: "" }));
            }}
            requiredAr={false}
            requiredEn={false}
            errors={{ ar: errors.reason, en: errors.reason }}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{t("attachments")}</p>
          <DragDropUploadArea
            uploadArea="ATTENDANCE_EXCUSE"
            onFilesSelected={handleFilesSelected}
            helperText={`${tUpload(rules.acceptLabelKey)} - ${Math.round(rules.maxSizeBytes / (1024 * 1024))}MB`}
          />
          {errors.attachments && <p className="text-xs mt-1" style={{ color: "var(--color-accent-700)" }}>{errors.attachments}</p>}
          {form.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.attachments.map((attachment) => (
                <div key={attachment.id} className="text-xs" style={{ color: "var(--text-secondary)" }}>{attachment.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { Alert } from "@mui/material";
import { Info } from "lucide-react";
import dayjs from "dayjs";
import {
  AcademicEvent,
  createTermEvent,
  updateEvent,
  deleteEvent,
  isEventWithinTermRange,
} from "@/features/academics/calendar/services/calendarService";
import { Term, fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: AcademicEvent | null;
  term: Term;
  prefilledDate: Date | null;
  isReadOnly: boolean;
}

export default function EventDialog({
  isOpen,
  onClose,
  onSuccess,
  event,
  term,
  prefilledDate,
  isReadOnly,
}: EventDialogProps) {
  const t = useTranslations("academics.calendar");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  // Form state
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [type, setType] = useState<AcademicEvent["type"]>("OTHER");
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [scopeType, setScopeType] = useState<AcademicEvent["scopeType"]>("SCHOOL");
  const [scopeId, setScopeId] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [notify, setNotify] = useState(true); // Notify checkbox for EXAM/HOLIDAY

  // Scope options
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load structure data for scope selection
  useEffect(() => {
    if (isOpen && term) {
      loadStructureData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, term]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        setTitleAr(event.titleAr);
        setTitleEn(event.titleEn);
        setType(event.type);
        setAllDay(event.allDay);
        setStartDate(new Date(event.startDate));
        setEndDate(new Date(event.endDate));
        setScopeType(event.scopeType);
        setScopeId(event.scopeId || "");
        setNotesAr(event.notesAr || "");
        setNotesEn(event.notesEn || "");
        setNotify(event.notify !== undefined ? event.notify : true);
      } else {
        // Create mode
        const dateObj = prefilledDate || new Date();

        setTitleAr("");
        setTitleEn("");
        setType("OTHER");
        setAllDay(true);
        setStartDate(dateObj);
        setEndDate(dateObj);
        setScopeType("SCHOOL");
        setScopeId("");
        setNotesAr("");
        setNotesEn("");
        setNotify(true); // Default to checked
      }
      setErrors({});
    }
  }, [isOpen, event, prefilledDate]);

  const loadStructureData = async () => {
    try {
      const structure = await fetchStructureTree(term.yearId, term.id);

      setStages(
        structure.stages.map((s) => ({
          id: s.id,
          name: s.name,
        }))
      );

      setGrades(
        structure.grades.map((g) => ({
          id: g.id,
          name: g.name,
        }))
      );

      setSections(
        structure.sections.map((s) => ({
          id: s.id,
          name: s.name,
        }))
      );
    } catch (error) {
      console.error("Failed to load structure:", error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!titleAr.trim()) newErrors.titleAr = tValidation("required_ar");
    if (!titleEn.trim()) newErrors.titleEn = tValidation("required_en");

    if (titleAr.trim() && titleEn.trim()) {
      const arEnErrors = validateArEnDifferent(titleAr, titleEn);
      if (arEnErrors.arError) newErrors.titleAr = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) newErrors.titleEn = tValidation("arEnMustDiffer");
    }

    // Date validation
    if (!startDate) newErrors.startDate = tValidation("required");
    if (!endDate) newErrors.endDate = tValidation("required");

    if (startDate && endDate) {
      if (startDate > endDate) {
        newErrors.endDate = t("validation.start_after_end");
      }

      // Check if within term range
      const startDateStr = dayjs(startDate).format("YYYY-MM-DD");
      const endDateStr = dayjs(endDate).format("YYYY-MM-DD");
      
      if (!isEventWithinTermRange(startDateStr, endDateStr, term.startDate, term.endDate)) {
        const termStartFormatted = dayjs(term.startDate).format(locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY");
        const termEndFormatted = dayjs(term.endDate).format(locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY");
        newErrors.general = t("validation.outside_term_range_with_dates", {
          start: termStartFormatted,
          end: termEndFormatted,
        });
      }
    }

    // Scope validation
    if (scopeType !== "SCHOOL" && !scopeId) {
      newErrors.scopeId = tValidation("required");
    }

    // Notes validation (AR != EN only if both filled)
    if (notesAr.trim() && notesEn.trim()) {
      const arEnErrors = validateArEnDifferent(notesAr, notesEn);
      if (arEnErrors.arError) newErrors.notesAr = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) newErrors.notesEn = tValidation("arEnMustDiffer");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Format dates without timezone conversion
      const formatDateToISO = (date: Date | null): string => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const payload = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        type,
        allDay,
        startDate: formatDateToISO(startDate),
        endDate: formatDateToISO(endDate),
        scopeType,
        scopeId: scopeType === "SCHOOL" ? undefined : scopeId,
        notesAr: notesAr.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        notify: (type === "EXAM" || type === "HOLIDAY") ? notify : undefined,
      };

      if (event) {
        await updateEvent(event.id, payload);
      } else {
        await createTermEvent(term.id, payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save event:", error);
      setErrors({ general: "Failed to save event" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) {
      return;
    }

    if (!event.id) {
      setErrors({ general: "Invalid event: missing ID" });
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      setShowDeleteConfirm(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to delete event:", error);
      setErrors({ 
        general: error instanceof Error ? error.message : "Failed to delete event" 
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const eventTypeOptions = [
    { value: "HOLIDAY", label: t("event_types.holiday") },
    { value: "EXAM", label: t("event_types.exam") },
    { value: "ACTIVITY", label: t("event_types.activity") },
    { value: "OTHER", label: t("event_types.other") },
  ];

  const scopeTypeOptions = [
    { value: "SCHOOL", label: t("scopes.school") },
    { value: "STAGE", label: t("scopes.stage") },
    { value: "GRADE", label: t("scopes.grade") },
    { value: "SECTION", label: t("scopes.section") },
  ];

  const getScopeTargetOptions = () => {
    switch (scopeType) {
      case "STAGE":
        return stages.map((s) => ({ value: s.id, label: s.name }));
      case "GRADE":
        return grades.map((g) => ({ value: g.id, label: g.name }));
      case "SECTION":
        return sections.map((s) => ({ value: s.id, label: s.name }));
      default:
        return [];
    }
  };

  const needsScopeTarget = scopeType !== "SCHOOL";

  // Format term dates for display
  const termStartFormatted = dayjs(term.startDate).format(locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY");
  const termEndFormatted = dayjs(term.endDate).format(locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY");

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={event ? t("edit_event") : t("add_event")}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {event && !isReadOnly && (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving}
                >
                  {t("delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="secondary" disabled={isSaving}>
                {t("cancel")}
              </Button>
              {!isReadOnly && (
                <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                  {isSaving ? t("saving") : t("save")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5 px-1">
          {/* General Error */}
          {errors.general && (
            <Alert severity="error" className="text-sm">
              {errors.general}
            </Alert>
          )}

          {/* Title */}
          <BilingualTextField
            label={t("title")}
            value={{ ar: titleAr, en: titleEn }}
            onChange={(value) => {
              setTitleAr(value.ar);
              setTitleEn(value.en);
              const newErrors = { ...errors };
              delete newErrors.titleAr;
              delete newErrors.titleEn;
              setErrors(newErrors);
            }}
            requiredAr
            requiredEn
            errors={{ ar: errors.titleAr, en: errors.titleEn }}
            disabled={isReadOnly}
            placeholder={{
              ar: "أدخل عنوان الحدث بالعربية",
              en: "Enter event title in English",
            }}
          />

          {/* Type and All Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("type")}
              value={type}
              onChange={(value) => setType(value as AcademicEvent["type"])}
              options={eventTypeOptions}
              required
              disabled={isReadOnly}
            />

            <div className="flex flex-col gap-2 justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  disabled={isReadOnly}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("all_day")}
                </span>
              </label>

              {/* Notify checkbox for EXAM and HOLIDAY */}
              {(type === "EXAM" || type === "HOLIDAY") && !isReadOnly && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t("notifyUsers")}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Term Range Hint */}
          <Alert 
            severity="info" 
            icon={<Info className="w-5 h-5" />}
            className="text-sm"
          >
            {t("term_range_hint", { start: termStartFormatted, end: termEndFormatted })}
          </Alert>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label={t("start_date")}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                const newErrors = { ...errors };
                delete newErrors.startDate;
                delete newErrors.general;
                setErrors(newErrors);
              }}
              error={errors.startDate}
              helperText={t("date_helper_text")}
              required
              disabled={isReadOnly}
              minDate={new Date(term.startDate)}
              maxDate={new Date(term.endDate)}
              format={locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            />

            <DatePicker
              label={t("end_date")}
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                const newErrors = { ...errors };
                delete newErrors.endDate;
                delete newErrors.general;
                setErrors(newErrors);
              }}
              error={errors.endDate}
              helperText={t("date_helper_text")}
              required
              disabled={isReadOnly}
              minDate={startDate || new Date(term.startDate)}
              maxDate={new Date(term.endDate)}
              format={locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            />
          </div>

          {/* Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("scope_type")}
              value={scopeType}
              onChange={(value) => {
                setScopeType(value as AcademicEvent["scopeType"]);
                setScopeId("");
                const newErrors = { ...errors };
                delete newErrors.scopeId;
                setErrors(newErrors);
              }}
              options={scopeTypeOptions}
              required
              disabled={isReadOnly}
            />

            {needsScopeTarget && (
              <Select
                label={t("scope_target")}
                value={scopeId}
                onChange={(value) => {
                  setScopeId(value);
                  const newErrors = { ...errors };
                  delete newErrors.scopeId;
                  setErrors(newErrors);
                }}
                options={getScopeTargetOptions()}
                required
                disabled={isReadOnly}
                error={errors.scopeId}
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t("notes")} ({t("optional")})
            </label>

            <textarea
              value={notesAr}
              onChange={(e) => {
                setNotesAr(e.target.value);
                const newErrors = { ...errors };
                delete newErrors.notesAr;
                setErrors(newErrors);
              }}
              placeholder="ملاحظات (اختياري)"
              disabled={isReadOnly}
              rows={3}
              dir="rtl"
              className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                errors.notesAr ? "border-red-500" : "border-gray-200"
              } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
            />
            {errors.notesAr && (
              <div className="text-xs text-red-600 text-right">{errors.notesAr}</div>
            )}

            <textarea
              value={notesEn}
              onChange={(e) => {
                setNotesEn(e.target.value);
                const newErrors = { ...errors };
                delete newErrors.notesEn;
                setErrors(newErrors);
              }}
              placeholder="Notes (optional)"
              disabled={isReadOnly}
              rows={3}
              dir="ltr"
              className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                errors.notesEn ? "border-red-500" : "border-gray-200"
              } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
            />
            {errors.notesEn && (
              <div className="text-xs text-red-600">{errors.notesEn}</div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("delete_confirm.title")}
        description={t("delete_confirm.message")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        severity="danger"
        loading={isDeleting}
      />
    </>
  );
}

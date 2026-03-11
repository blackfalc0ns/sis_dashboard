"use client";

import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Edit2, Calendar, User, GraduationCap } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { AbsenceRecord } from "../types";

interface AbsenceDetailsPanelProps {
  record: AbsenceRecord | null;
  onClose: () => void;
  onEditExcuse: (record: AbsenceRecord) => void;
  onEditEarlyLeave: (record: AbsenceRecord) => void;
  isReadOnly: boolean;
}

export default function AbsenceDetailsPanel({
  record,
  onClose,
  onEditExcuse,
  onEditEarlyLeave,
  isReadOnly,
}: AbsenceDetailsPanelProps) {
  const t = useTranslations("attendance.absences.details");
  const locale = useLocale();

  if (!record) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--card-background)" }}
      >
        <p style={{ color: "var(--color-neutral-500)" }} className="text-sm">{t("selectRecord")}</p>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      ABSENT: { en: "Absent", ar: "غائب" },
      LATE: { en: "Late", ar: "متأخر" },
      EARLY_LEAVE: { en: "Early Leave", ar: "مغادرة مبكرة" },
      EXCUSED: { en: "Excused", ar: "بعذر" },
      UNMARKED: { en: "Unmarked", ar: "غير محدد" },
    };
    return locale === "ar" ? labels[status]?.ar : labels[status]?.en;
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "var(--card-background)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b shrink-0"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h3>
        <button
          onClick={onClose}
          style={{ color: "var(--color-neutral-400)" }}
          className="hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Student Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
              <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("studentInfo")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("studentName")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">
                  {locale === "ar" ? record.studentNameAr : record.studentNameEn}
                </p>
                <p style={{ color: "var(--color-neutral-500)" }} className="text-xs">
                  {locale === "ar" ? record.studentNameEn : record.studentNameAr}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("studentNumber")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.studentNumber}</p>
              </div>
            </div>
          </div>

          {/* Grade & Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
              <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("gradeSection")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("grade")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                  {record.gradeNameAr || record.gradeNameEn || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("section")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                  {record.sectionNameAr || record.sectionNameEn || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
              <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("incidentDetails")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("date")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.date}</p>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("type")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                  {record.granularity === "DAILY_DERIVED"
                    ? locale === "ar"
                      ? "يومي (مشتق)"
                      : "Daily (Derived)"
                    : locale === "ar"
                    ? "حصة"
                    : "Period"}
                </p>
              </div>
              {record.periodIndex && (
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("period")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    P{record.periodIndex} - {locale === "ar" ? record.periodNameAr : record.periodNameEn}
                  </p>
                </div>
              )}
              <div>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("status")}:</span>
                <p style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">{getStatusLabel(record.status)}</p>
              </div>
              {record.minutesLate && (
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("minutesLate")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.minutesLate}</p>
                </div>
              )}
              {record.minutesEarlyLeave && (
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("minutesEarlyLeave")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">{record.minutesEarlyLeave}</p>
                </div>
              )}
            </div>
          </div>

          {/* Excuse */}
          {record.excuse && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText style={{ color: "var(--color-neutral-400)" }} className="w-4 h-4" />
                <h4 style={{ color: "var(--color-gray-700)" }} className="text-sm font-semibold">{t("excuse")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("reason")}:</span>
                  <p style={{ color: "var(--color-gray-900)" }} className="text-sm">
                    {locale === "ar" ? record.excuse.reasonAr : record.excuse.reasonEn}
                  </p>
                </div>
                {record.excuse.attachments && record.excuse.attachments.length > 0 && (
                  <div>
                    <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{t("attachments")}:</span>
                    <div className="mt-1 space-y-1">
                      {record.excuse.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                        >
                          {att.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {record.granularity === "PERIOD" && !isReadOnly && (
        <div
          className="flex items-center gap-3 p-4 border-t shrink-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          {(record.status === "ABSENT" || record.status === "EXCUSED") && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => onEditExcuse(record)}
              className="flex-1"
            >
              {record.excuse ? t("editExcuse") : t("addExcuse")}
            </Button>
          )}
          {record.status === "EARLY_LEAVE" && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-4 h-4" />}
              onClick={() => onEditEarlyLeave(record)}
              className="flex-1"
            >
              {t("editMinutes")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

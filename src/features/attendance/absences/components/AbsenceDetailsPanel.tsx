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
        <p className="text-sm text-gray-500">{t("selectRecord")}</p>
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
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <User className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">{t("studentInfo")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span className="text-xs text-gray-500">{t("studentName")}:</span>
                <p className="text-sm font-medium text-gray-900">
                  {locale === "ar" ? record.studentNameAr : record.studentNameEn}
                </p>
                <p className="text-xs text-gray-500">
                  {locale === "ar" ? record.studentNameEn : record.studentNameAr}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t("studentNumber")}:</span>
                <p className="text-sm text-gray-900">{record.studentNumber}</p>
              </div>
            </div>
          </div>

          {/* Grade & Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">{t("gradeSection")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span className="text-xs text-gray-500">{t("grade")}:</span>
                <p className="text-sm text-gray-900">
                  {record.gradeNameAr || record.gradeNameEn || "-"}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t("section")}:</span>
                <p className="text-sm text-gray-900">
                  {record.sectionNameAr || record.sectionNameEn || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">{t("incidentDetails")}</h4>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <span className="text-xs text-gray-500">{t("date")}:</span>
                <p className="text-sm text-gray-900">{record.date}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t("type")}:</span>
                <p className="text-sm text-gray-900">
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
                  <span className="text-xs text-gray-500">{t("period")}:</span>
                  <p className="text-sm text-gray-900">
                    P{record.periodIndex} - {locale === "ar" ? record.periodNameAr : record.periodNameEn}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">{t("status")}:</span>
                <p className="text-sm font-medium text-gray-900">{getStatusLabel(record.status)}</p>
              </div>
              {record.minutesLate && (
                <div>
                  <span className="text-xs text-gray-500">{t("minutesLate")}:</span>
                  <p className="text-sm text-gray-900">{record.minutesLate}</p>
                </div>
              )}
              {record.minutesEarlyLeave && (
                <div>
                  <span className="text-xs text-gray-500">{t("minutesEarlyLeave")}:</span>
                  <p className="text-sm text-gray-900">{record.minutesEarlyLeave}</p>
                </div>
              )}
            </div>
          </div>

          {/* Excuse */}
          {record.excuse && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-700">{t("excuse")}</h4>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <span className="text-xs text-gray-500">{t("reason")}:</span>
                  <p className="text-sm text-gray-900">
                    {locale === "ar" ? record.excuse.reasonAr : record.excuse.reasonEn}
                  </p>
                </div>
                {record.excuse.attachments && record.excuse.attachments.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">{t("attachments")}:</span>
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

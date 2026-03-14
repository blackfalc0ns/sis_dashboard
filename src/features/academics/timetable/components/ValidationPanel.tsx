"use client";

import { useTranslations } from "next-intl";
import { X, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Drawer } from "@mui/material";
import { TimetableConflict, SubjectHoursSummary } from "@/features/academics/timetable/types/timetable";
import { ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";

interface ValidationPanelProps {
  open: boolean;
  subjectHours: SubjectHoursSummary[];
  conflicts: TimetableConflict[];
  totalSlots: number;
  filledSlots: number;
  missingTeacher: number;
  missingRoom: number;
  roomDefaultSource?: Extract<
    RoomAssignmentSource,
    "CLASSROOM_DEFAULT" | "SECTION_DEFAULT"
  > | null;
  onClose: () => void;
  locale: string;
  resolvedConfig: ResolvedTimetableConfig;
}

export default function ValidationPanel({
  open,
  subjectHours,
  conflicts,
  totalSlots,
  filledSlots,
  missingTeacher,
  missingRoom,
  roomDefaultSource,
  onClose,
  locale,
  resolvedConfig,
}: ValidationPanelProps) {
  const t = useTranslations("academics.timetable.validation");
  const tGrid = useTranslations("academics.timetable.grid");
  const isRTL = locale === "ar";

  const completionPercentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const getDayName = (dayKey: string): string => {
    const day = resolvedConfig.days.find((d) => d.key === dayKey);
    return day ? (locale === "ar" ? day.nameAr : day.nameEn) : dayKey;
  };

  const roomDefaultSourceLabel = roomDefaultSource
    ? t(
        roomDefaultSource === "CLASSROOM_DEFAULT"
          ? "roomSourceClassroomDefault"
          : "roomSourceSectionDefault"
      )
    : null;

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 360,
          maxWidth: "90vw",
        },
      }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Completeness */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {t("completeness")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("filledSlots")}</span>
                <span className="font-medium text-gray-900">
                  {filledSlots} / {totalSlots}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                {completionPercentage}%
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {missingTeacher > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {missingTeacher} {t("missingTeacher")}
                  </span>
                </div>
              )}
              {missingRoom > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {missingRoom} {t("missingRoom")}
                    </span>
                  </div>
                  {roomDefaultSourceLabel && (
                    <p className="text-xs text-gray-500">
                      {t("roomDefaultAvailable", { source: roomDefaultSourceLabel })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Target vs Actual */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {t("targetVsActual")}
            </h4>
            <div className="space-y-3">
              {subjectHours.length === 0 ? (
                <p className="text-sm text-gray-500">No subjects allocated</p>
              ) : (
                subjectHours.map((subject) => (
                  <div key={subject.subjectId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 font-medium line-clamp-1">
                        {locale === "ar" ? subject.subjectNameAr : subject.subjectNameEn}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {subject.actual} / {subject.target}
                        </span>
                        {subject.status === "OK" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {subject.status === "UNDER" && (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        {subject.status === "OVER" && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          subject.status === "OK"
                            ? "bg-green-500"
                            : subject.status === "UNDER"
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min((subject.actual / subject.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {subject.status !== "OK" && (
                      <p className="text-xs text-gray-500">
                        {subject.status === "UNDER" && t("under")}
                        {subject.status === "OVER" && t("over")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conflicts */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              {t("conflicts")}
            </h4>
            {conflicts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t("noConflicts")}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900">
                          {conflict.type === "TEACHER" ? t("teacherConflict") : t("roomConflict")}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {conflict.resourceName}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {getDayName(conflict.dayKey)}, {tGrid("period")} {conflict.periodIndex}
                        </p>
                        <div className="mt-2 space-y-1">
                          {conflict.sections.map((section, idx) => (
                            <p key={idx} className="text-xs text-red-600">
                              • {section.sectionName}{section.classroomName ? ` / ${section.classroomName}` : ""}: {section.subjectName}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}


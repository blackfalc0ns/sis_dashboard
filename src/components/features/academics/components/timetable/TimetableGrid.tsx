"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { TimetableEntry, TimetableConflict } from "@/types/academics/timetable";
import { Subject } from "@/services/academics/subjectsService";
import { Teacher } from "@/services/academics/teacherAllocationService";
import { Room } from "@/types/academics/timetable";

interface TimetableGridProps {
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  conflicts: TimetableConflict[];
  onSlotClick: (day: number, period: number) => void;
  locale: string;
  isReadOnly: boolean;
}

const DAYS = [0, 1, 2, 3, 4]; // Sunday to Thursday
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetableGrid({
  entries,
  subjects,
  teachers,
  rooms,
  conflicts,
  onSlotClick,
  locale,
  isReadOnly,
}: TimetableGridProps) {
  const t = useTranslations("academics.timetable.grid");

  const getDayName = (day: number): string => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return t(days[day]);
  };

  const getEntry = (day: number, period: number): TimetableEntry | undefined => {
    return entries.find((e) => e.day === day && e.period === period);
  };

  const hasConflict = (day: number, period: number): boolean => {
    return conflicts.some((c) => c.day === day && c.period === period);
  };

  const getSubjectName = (subjectId: string | null): string => {
    if (!subjectId) return "";
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return "";
    return locale === "ar" ? subject.nameAr : subject.nameEn;
  };

  const getTeacherName = (teacherId: string | null): string => {
    if (!teacherId) return "";
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return "";
    return locale === "ar" ? teacher.nameAr : teacher.nameEn;
  };

  const getRoomName = (roomId: string | null): string => {
    if (!roomId) return "";
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return "";
    return locale === "ar" ? room.nameAr : room.nameEn;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky top-0 left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[100px]">
                {t("period")}
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[180px]"
                >
                  {getDayName(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                  {period}
                </td>
                {DAYS.map((day) => {
                  const entry = getEntry(day, period);
                  const conflict = hasConflict(day, period);

                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`border-b border-gray-200 p-2 cursor-pointer transition-colors ${
                        conflict ? "bg-red-50 border-red-200" : ""
                      } ${!isReadOnly ? "hover:bg-blue-50" : ""}`}
                      onClick={() => !isReadOnly && onSlotClick(day, period)}
                    >
                      {entry?.subjectId ? (
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {getSubjectName(entry.subjectId)}
                            </div>
                            {conflict && (
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          {entry.teacherId && (
                            <div className="text-xs text-gray-600 line-clamp-1">
                              {getTeacherName(entry.teacherId)}
                            </div>
                          )}
                          {entry.roomId && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {getRoomName(entry.roomId)}
                            </div>
                          )}
                          {!entry.teacherId && (
                            <div className="text-xs text-orange-600">
                              {t("validation.missingTeacher")}
                            </div>
                          )}
                          {!entry.roomId && (
                            <div className="text-xs text-orange-600">
                              {t("validation.missingRoom")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center py-4">
                          {t("emptySlot")}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

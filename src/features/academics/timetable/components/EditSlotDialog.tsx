"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { Room } from "@/features/academics/timetable/types/timetable";
import { RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";

type ResolvedRoomSuggestion = {
  roomId: string | null;
  source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
};

interface EditSlotDialogProps {
  open: boolean;
  dayKey: string;
  periodIndex: number;
  dayName: string;
  entry?: TimetableEntry;
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  onSave: (
    dayKey: string,
    periodIndex: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null,
    slotType?: "CLASS" | "BREAK",
    breakLabelAr?: string,
    breakLabelEn?: string
  ) => void;
  onClose: () => void;
  getDefaultTeacher: (subjectId: string) => string | null;
  getDefaultRoomSuggestion: (subjectId: string) => ResolvedRoomSuggestion;
  getRoomSource: (
    roomId: string | null,
    subjectId?: string
  ) => RoomAssignmentSource | null;
  selectedClassroomName?: string;
  locale: string;
}

export default function EditSlotDialog({
  open,
  dayKey,
  periodIndex,
  dayName,
  entry,
  subjects,
  teachers,
  rooms,
  onSave,
  onClose,
  getDefaultTeacher,
  getDefaultRoomSuggestion,
  getRoomSource,
  selectedClassroomName,
  locale,
}: EditSlotDialogProps) {
  const t = useTranslations("academics.timetable.editSlot");

  const [slotType, setSlotType] = useState<"CLASS" | "BREAK">("CLASS");
  const [subjectId, setSubjectId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [breakLabelAr, setBreakLabelAr] = useState<string>("فسحة");
  const [breakLabelEn, setBreakLabelEn] = useState<string>("Break");
  const [autoFilledTeacher, setAutoFilledTeacher] = useState(false);
  const [autoFilledRoom, setAutoFilledRoom] = useState(false);
  const [roomSource, setRoomSource] = useState<RoomAssignmentSource | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (entry) {
      setSlotType(entry.slotType || "CLASS");
      setSubjectId(entry.subjectId || "");
      setTeacherId(entry.teacherId || "");
      setRoomId(entry.roomId || "");
      setRoomSource(getRoomSource(entry.roomId || null, entry.subjectId || undefined));
      setBreakLabelAr(entry.breakLabelAr || "فسحة");
      setBreakLabelEn(entry.breakLabelEn || "Break");
    } else {
      setSlotType("CLASS");
      setSubjectId("");
      setTeacherId("");
      setRoomId("");
      setRoomSource(null);
      setBreakLabelAr("فسحة");
      setBreakLabelEn("Break");
    }

    setAutoFilledTeacher(false);
    setAutoFilledRoom(false);
  }, [open, entry, getRoomSource]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const slotTypeOptions = [
    { value: "CLASS", label: t("class") },
    { value: "BREAK", label: t("break") },
  ];

  const subjectOptions = [
    { value: "", label: t("noSubject") },
    ...subjects.map((subject) => ({
      value: subject.id,
      label: locale === "ar" ? subject.nameAr : subject.nameEn,
    })),
  ];

  const teacherOptions = [
    { value: "", label: t("noTeacher") },
    ...teachers.map((teacher) => ({
      value: teacher.id,
      label: locale === "ar" ? teacher.nameAr : teacher.nameEn,
    })),
  ];

  const roomOptions = [
    { value: "", label: t("noRoom") },
    ...rooms.map((room) => ({
      value: room.id,
      label: locale === "ar" ? room.nameAr : room.nameEn,
    })),
  ];

  const getRoomSourceLabel = (source: RoomAssignmentSource | null) => {
    switch (source) {
      case "CLASSROOM_DEFAULT":
        return t("roomSourceClassroomDefault");
      case "SECTION_DEFAULT":
        return t("roomSourceSectionDefault");
      case "RECOMMENDED":
        return t("roomSourceRecommended");
      case "MANUAL":
        return t("roomSourceManual");
      default:
        return null;
    }
  };

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);

    if (!value) {
      setTeacherId("");
      setRoomId("");
      setRoomSource(null);
      setAutoFilledTeacher(false);
      setAutoFilledRoom(false);
      return;
    }

    const defaultTeacher = getDefaultTeacher(value);
    if (defaultTeacher) {
      setTeacherId(defaultTeacher);
      setAutoFilledTeacher(true);
    } else {
      setAutoFilledTeacher(false);
    }

    const roomSuggestion = getDefaultRoomSuggestion(value);
    if (roomSuggestion.roomId) {
      setRoomId(roomSuggestion.roomId);
      setRoomSource(roomSuggestion.source);
      setAutoFilledRoom(true);
    } else {
      setRoomId("");
      setRoomSource(null);
      setAutoFilledRoom(false);
    }
  };

  const handleSave = () => {
    if (slotType === "BREAK") {
      onSave(
        dayKey,
        periodIndex,
        null,
        null,
        null,
        "BREAK",
        breakLabelAr,
        breakLabelEn
      );
      return;
    }

    onSave(
      dayKey,
      periodIndex,
      subjectId || null,
      teacherId || null,
      roomId || null,
      "CLASS"
    );
  };

  const handleClear = () => {
    setSlotType("CLASS");
    setSubjectId("");
    setTeacherId("");
    setRoomId("");
    setRoomSource(null);
    setBreakLabelAr("فسحة");
    setBreakLabelEn("Break");
    setAutoFilledTeacher(false);
    setAutoFilledRoom(false);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("title")}
      description={`${dayName} - ${t("period", { number: periodIndex })}`}
      size="md"
      footer={
        <>
          <Button onClick={handleClear} variant="secondary">
            {t("clear")}
          </Button>
          <div className="flex-1" />
          <Button onClick={onClose} variant="secondary">
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} variant="primary">
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {selectedClassroomName && slotType === "CLASS" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {t("targetClassroom", { classroom: selectedClassroomName })}
          </div>
        )}

        <div>
          <Select
            label={t("slotType")}
            value={slotType}
            onChange={(value) => setSlotType(value as "CLASS" | "BREAK")}
            options={slotTypeOptions}
          />
        </div>

        {slotType === "BREAK" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-sm text-amber-800">{t("breakInfo")}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("breakLabelAr")}
                </label>
                <input
                  type="text"
                  value={breakLabelAr}
                  onChange={(event) => setBreakLabelAr(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                  placeholder="فسحة"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("breakLabelEn")}
                </label>
                <input
                  type="text"
                  value={breakLabelEn}
                  onChange={(event) => setBreakLabelEn(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                  placeholder="Break"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <Select
                label={t("subject")}
                value={subjectId}
                onChange={handleSubjectChange}
                options={subjectOptions}
                placeholder={t("selectSubject")}
              />
            </div>

            <div>
              <Select
                label={t("teacher")}
                value={teacherId}
                onChange={(value) => {
                  setTeacherId(value);
                  setAutoFilledTeacher(false);
                }}
                options={teacherOptions}
                placeholder={t("selectTeacher")}
                disabled={!subjectId}
              />
              {autoFilledTeacher && (
                <p className="mt-1 text-xs text-blue-600">{t("autoFilled")}</p>
              )}
            </div>

            <div>
              <Select
                label={t("room")}
                value={roomId}
                onChange={(value) => {
                  setRoomId(value);
                  setRoomSource(value ? "MANUAL" : null);
                  setAutoFilledRoom(false);
                }}
                options={roomOptions}
                placeholder={t("selectRoom")}
                disabled={!subjectId}
              />
              {(autoFilledRoom || roomSource) && (
                <p className="mt-1 text-xs text-blue-600">
                  {autoFilledRoom ? t("autoFilledRoom") : t("roomSourceLabel")}
                  {roomSource ? ` ${getRoomSourceLabel(roomSource)}` : ""}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

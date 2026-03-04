"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { TimetableEntry } from "@/types/academics/timetable";
import { Subject } from "@/services/academics/subjectsService";
import { Teacher } from "@/services/academics/teacherAllocationService";
import { Room } from "@/types/academics/timetable";

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
  locale,
}: EditSlotDialogProps) {
  const t = useTranslations("academics.timetable.editSlot");

  const [slotType, setSlotType] = useState<"CLASS" | "BREAK">("CLASS");
  const [subjectId, setSubjectId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [breakLabelAr, setBreakLabelAr] = useState<string>("فُسحة");
  const [breakLabelEn, setBreakLabelEn] = useState<string>("Break");
  const [autoFilledTeacher, setAutoFilledTeacher] = useState(false);

  // Reset state when dialog opens or entry changes
  /* eslint-disable react-hooks/set-state-in-effect */
  // Form reset pattern: sync form state with dialog open/entry changes
  useEffect(() => {
    if (open) {
      if (entry) {
        setSlotType(entry.slotType || "CLASS");
        setSubjectId(entry.subjectId || "");
        setTeacherId(entry.teacherId || "");
        setRoomId(entry.roomId || "");
        setBreakLabelAr(entry.breakLabelAr || "فُسحة");
        setBreakLabelEn(entry.breakLabelEn || "Break");
      } else {
        // Reset to defaults when no entry
        setSlotType("CLASS");
        setSubjectId("");
        setTeacherId("");
        setRoomId("");
        setBreakLabelAr("فُسحة");
        setBreakLabelEn("Break");
      }
      setAutoFilledTeacher(false);
    }
  }, [open, entry]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const slotTypeOptions = [
    { value: "CLASS", label: t("class") },
    { value: "BREAK", label: t("break") },
  ];

  const subjectOptions = [
    { value: "", label: t("noSubject") },
    ...subjects.map((s) => ({
      value: s.id,
      label: locale === "ar" ? s.nameAr : s.nameEn,
    })),
  ];

  const teacherOptions = [
    { value: "", label: t("noTeacher") },
    ...teachers.map((t) => ({
      value: t.id,
      label: locale === "ar" ? t.nameAr : t.nameEn,
    })),
  ];

  const roomOptions = [
    { value: "", label: t("noRoom") },
    ...rooms.map((r) => ({
      value: r.id,
      label: locale === "ar" ? r.nameAr : r.nameEn,
    })),
  ];

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);

    // Auto-fill teacher from allocation
    if (value) {
      const defaultTeacher = getDefaultTeacher(value);
      if (defaultTeacher) {
        setTeacherId(defaultTeacher);
        setAutoFilledTeacher(true);
      }
    } else {
      setTeacherId("");
      setAutoFilledTeacher(false);
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
    } else {
      onSave(
        dayKey,
        periodIndex,
        subjectId || null,
        teacherId || null,
        roomId || null,
        "CLASS"
      );
    }
  };

  const handleClear = () => {
    setSlotType("CLASS");
    setSubjectId("");
    setTeacherId("");
    setRoomId("");
    setBreakLabelAr("فُسحة");
    setBreakLabelEn("Break");
    setAutoFilledTeacher(false);
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
          {/* Slot Type */}
          <div>
            <Select
              label={t("slotType")}
              value={slotType}
              onChange={(value) => setSlotType(value as "CLASS" | "BREAK")}
              options={slotTypeOptions}
            />
          </div>

          {slotType === "BREAK" ? (
            // Break slot fields
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 mb-3">
                  {t("breakInfo")}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("breakLabelAr")}
                    </label>
                    <input
                      type="text"
                      value={breakLabelAr}
                      onChange={(e) => setBreakLabelAr(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="فُسحة"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("breakLabelEn")}
                    </label>
                    <input
                      type="text"
                      value={breakLabelEn}
                      onChange={(e) => setBreakLabelEn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Break"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Class slot fields
            <>
              {/* Subject */}
              <div>
                <Select
                  label={t("subject")}
                  value={subjectId}
                  onChange={handleSubjectChange}
                  options={subjectOptions}
                  placeholder={t("selectSubject")}
                />
              </div>

              {/* Teacher */}
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
                  <p className="text-xs text-blue-600 mt-1">{t("autoFilled")}</p>
                )}
              </div>

              {/* Room */}
              <div>
                <Select
                  label={t("room")}
                  value={roomId}
                  onChange={setRoomId}
                  options={roomOptions}
                  placeholder={t("selectRoom")}
                  disabled={!subjectId}
                />
              </div>
            </>
          )}
        </div>
    </Modal>
  );
}

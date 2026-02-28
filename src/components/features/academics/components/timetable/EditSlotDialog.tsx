"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { X } from "lucide-react";
import Select from "@/components/ui/input/Select";
import { Button } from "@/components/ui";
import { TimetableEntry } from "@/types/academics/timetable";
import { Subject } from "@/services/academics/subjectsService";
import { Teacher } from "@/services/academics/teacherAllocationService";
import { Room } from "@/types/academics/timetable";

interface EditSlotDialogProps {
  open: boolean;
  day: number;
  period: number;
  entry?: TimetableEntry;
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  onSave: (
    day: number,
    period: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null
  ) => void;
  onClose: () => void;
  getDefaultTeacher: (subjectId: string) => string | null;
  locale: string;
}

export default function EditSlotDialog({
  open,
  day,
  period,
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
  const tGrid = useTranslations("academics.timetable.grid");

  const [subjectId, setSubjectId] = useState<string>(entry?.subjectId || "");
  const [teacherId, setTeacherId] = useState<string>(entry?.teacherId || "");
  const [roomId, setRoomId] = useState<string>(entry?.roomId || "");
  const [autoFilledTeacher, setAutoFilledTeacher] = useState(false);

  useEffect(() => {
    if (entry) {
      setSubjectId(entry.subjectId || "");
      setTeacherId(entry.teacherId || "");
      setRoomId(entry.roomId || "");
    }
  }, [entry]);

  const getDayName = (dayNum: number): string => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return tGrid(days[dayNum]);
  };

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
    onSave(
      day,
      period,
      subjectId || null,
      teacherId || null,
      roomId || null
    );
  };

  const handleClear = () => {
    setSubjectId("");
    setTeacherId("");
    setRoomId("");
    setAutoFilledTeacher(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
        <div>
          <div className="text-lg font-semibold text-gray-900">{t("title")}</div>
          <div className="text-sm text-gray-500 mt-1">
            {getDayName(day)} - {t("period", { number: period })}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <div className="space-y-4">
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
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
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
      </DialogActions>
    </Dialog>
  );
}

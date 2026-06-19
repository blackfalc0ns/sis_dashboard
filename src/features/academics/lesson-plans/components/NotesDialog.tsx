"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { TextArea } from "@/components/ui/input";

interface NotesDialogProps {
  isOpen: boolean;
  notesAr?: string;
  notesEn?: string;
  onClose: () => void;
  onSave: (notesAr: string, notesEn: string) => void;
}

export default function NotesDialog({
  isOpen,
  notesAr = "",
  notesEn = "",
  onClose,
  onSave,
}: NotesDialogProps) {
  const t = useTranslations("academics.lessonPlans.notesDialog");

  const [localNotesAr, setLocalNotesAr] = useState(notesAr);
  const [localNotesEn, setLocalNotesEn] = useState(notesEn);

  useEffect(() => {
    // Reset local state when dialog opens with new values
    if (isOpen) {
      setLocalNotesAr(notesAr);
      setLocalNotesEn(notesEn);
    }
  }, [isOpen, notesAr, notesEn]);

  const handleSave = () => {
    onSave(localNotesAr, localNotesEn);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} variant="primary">
            {t("save")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <TextArea
            label={t("notesAr")}
            value={localNotesAr}
            onChange={(e) => setLocalNotesAr(e.target.value)}
            rows={4}
            dir="rtl"
          />
        </div>
        <div>
          <TextArea
            label={t("notesEn")}
            value={localNotesEn}
            onChange={(e) => setLocalNotesEn(e.target.value)}
            rows={4}
            dir="ltr"
          />
        </div>
      </div>
    </Modal>
  );
}

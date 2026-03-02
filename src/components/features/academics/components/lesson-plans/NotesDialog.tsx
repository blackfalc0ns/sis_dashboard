"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";

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
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            {t("notesAr")}
          </label>
          <textarea
            value={localNotesAr}
            onChange={(e) => setLocalNotesAr(e.target.value)}
            rows={4}
            dir="rtl"
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
            {t("notesEn")}
          </label>
          <textarea
            value={localNotesEn}
            onChange={(e) => setLocalNotesEn(e.target.value)}
            rows={4}
            dir="ltr"
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>
    </Modal>
  );
}

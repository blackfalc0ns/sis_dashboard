"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";

interface EarlyLeaveEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
  initialMinutes?: number;
  isReadOnly: boolean;
}

export default function EarlyLeaveEditorModal({
  isOpen,
  onClose,
  onSave,
  initialMinutes = 0,
  isReadOnly,
}: EarlyLeaveEditorModalProps) {
  const t = useTranslations("attendance.absences.earlyLeave");
  const tCommon = useTranslations("common");

  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMinutes(initialMinutes);
      setError("");
    }
  }, [isOpen, initialMinutes]);

  const handleSave = () => {
    if (minutes < 0) {
      setError(t("invalidMinutes"));
      return;
    }

    onSave(minutes);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{t("title")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("minutesLabel")} <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => {
                setMinutes(parseInt(e.target.value) || 0);
                setError("");
              }}
              disabled={isReadOnly}
              min={0}
              placeholder="0"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">{t("helper")}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          {!isReadOnly && (
            <Button variant="primary" onClick={handleSave}>
              {tCommon("save")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

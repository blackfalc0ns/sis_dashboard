"use client";

import { useTranslations } from "next-intl";
import { Alert } from "@mui/material";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";

interface ConfigChangeWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  droppedCount: number;
  keptCount: number;
}

export default function ConfigChangeWarningDialog({
  open,
  onClose,
  onConfirm,
  droppedCount,
  keptCount,
}: ConfigChangeWarningDialogProps) {
  const t = useTranslations("academics.timetable.config");
  const tCommon = useTranslations("common");

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("changeWarning.title")}
      icon={<AlertTriangle className="w-6 h-6" />}
      variant="danger"
      size="xl"
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            {tCommon("cancel")}
          </Button>
          <Button onClick={onConfirm} variant="primary">
            {t("changeWarning.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert severity="warning">{t("changeWarning.message")}</Alert>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="text-sm">
            <span className="font-semibold text-green-700">
              {t("changeWarning.kept")}:
            </span>{" "}
            {keptCount} {t("changeWarning.entries")}
          </div>
          <div className="text-sm">
            <span className="font-semibold text-red-700">
              {t("changeWarning.dropped")}:
            </span>{" "}
            {droppedCount} {t("changeWarning.entries")}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {t("changeWarning.saveRequired")}
        </p>
      </div>
    </Modal>
  );
}

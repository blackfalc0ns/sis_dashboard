"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { ExcuseRequest } from "../types";

interface DecisionModalProps {
  isOpen: boolean;
  request: ExcuseRequest | null;
  action: "APPROVE" | "REJECT";
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}

export default function DecisionModal({ isOpen, request, action, onClose, onConfirm }: DecisionModalProps) {
  const t = useTranslations("attendance.excuses.modal");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isApprove = action === "APPROVE";

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(note);
      setNote("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? t("approveTitle") : t("rejectTitle")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button variant={isApprove ? "primary" : "danger"} onClick={handleConfirm} loading={loading}>
            {isApprove ? t("approve") : t("reject")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {request ? `${request.studentNameEn} / ${request.studentNameAr} - ${request.dateFrom} → ${request.dateTo}` : ""}
        </p>
        <Input
          label={t("decisionNote")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("decisionNotePlaceholder")}
        />
      </div>
    </Modal>
  );
}

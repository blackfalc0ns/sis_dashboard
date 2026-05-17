"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { BlockFormValues } from "@/features/communication/hooks/useBlocks";

export interface CreateBlockDialogLabels {
  title: string;
  targetUserId: string;
  reason: string;
  reasonPlaceholder: string;
  cancel: string;
  create: string;
  targetRequired: string;
}

export interface CreateBlockDialogProps {
  open: boolean;
  labels: CreateBlockDialogLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: BlockFormValues) => Promise<void> | void;
}

export default function CreateBlockDialog({
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: CreateBlockDialogProps) {
  const [values, setValues] = useState<BlockFormValues>({
    targetUserId: "",
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!values.targetUserId.trim()) {
      setError(labels.targetRequired);
      return;
    }
    setError(null);
    await onSubmit(values);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.title}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {labels.create}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <Input
          label={labels.targetUserId}
          value={values.targetUserId}
          error={error ?? undefined}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              targetUserId: event.target.value,
            }))
          }
        />
        <TextArea
          label={labels.reason}
          placeholder={labels.reasonPlaceholder}
          value={values.reason ?? ""}
          rows={4}
          onChange={(event) =>
            setValues((current) => ({ ...current, reason: event.target.value }))
          }
        />
      </div>
    </Modal>
  );
}

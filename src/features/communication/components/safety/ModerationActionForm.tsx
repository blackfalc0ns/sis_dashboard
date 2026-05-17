"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { ModerationActionType } from "@/features/communication/types/safety.types";

export interface ModerationActionFormLabels {
  title: string;
  reason: string;
  reasonPlaceholder: string;
  hide: string;
  unhide: string;
  reasonRequired: string;
}

export interface ModerationActionFormProps {
  disabled?: boolean;
  isSubmitting?: boolean;
  labels: ModerationActionFormLabels;
  onSubmit: (
    action: ModerationActionType,
    reason?: string,
  ) => Promise<void> | void;
}

export default function ModerationActionForm({
  disabled,
  isSubmitting,
  labels,
  onSubmit,
}: ModerationActionFormProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: ModerationActionType) => {
    if (!reason.trim()) {
      setError(labels.reasonRequired);
      return;
    }
    setError(null);
    await onSubmit(action, reason);
    setReason("");
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      <TextArea
        label={labels.reason}
        placeholder={labels.reasonPlaceholder}
        value={reason}
        rows={4}
        error={error ?? undefined}
        disabled={disabled || isSubmitting}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          loading={isSubmitting}
          leftIcon={<EyeOff className="h-4 w-4" aria-hidden="true" />}
          onClick={() => void submit("hide")}
        >
          {labels.hide}
        </Button>
        <Button
          type="button"
          disabled={disabled}
          loading={isSubmitting}
          leftIcon={<Eye className="h-4 w-4" aria-hidden="true" />}
          onClick={() => void submit("unhide")}
        >
          {labels.unhide}
        </Button>
      </div>
    </section>
  );
}

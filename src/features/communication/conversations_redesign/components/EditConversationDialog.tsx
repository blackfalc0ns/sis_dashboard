"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { UpdateConversationPayload } from "@/features/communication/types/conversation.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export interface EditConversationDialogProps {
  open: boolean;
  conversation: Conversation | null;
  labels: ConversationRedesignLabels;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateConversationPayload) => Promise<void> | void;
}

export default function EditConversationDialog({
  conversation,
  isSubmitting,
  labels,
  onClose,
  onSubmit,
  open,
}: EditConversationDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (open && conversation) {
      const record = conversation as Record<string, unknown>;
      setTitle(
        conversation.title ??
        (typeof record.titleEn === "string" ? record.titleEn : "") ??
        "",
      );
      setDescription(
        typeof record.description === "string" ? record.description :
        typeof record.descriptionEn === "string" ? record.descriptionEn : "",
      );
      setIsReadOnly(Boolean(record.isReadOnly));
      setIsPinned(Boolean(record.isPinned));
    }
  }, [open, conversation]);

  const handleSubmit = async () => {
    const payload: UpdateConversationPayload = {
      title: title.trim() || null,
      description: description.trim() || null,
      isReadOnly,
      isPinned,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={labels.editConversation}
      size="md"
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
            {labels.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {labels.title}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={labels.title}
            maxLength={255}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {labels.description}
          </label>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={labels.description}
            rows={3}
            resize="none"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isReadOnly}
              onChange={(e) => setIsReadOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            {labels.readOnly}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            {labels.pinned}
          </label>
        </div>
      </div>
    </Modal>
  );
}

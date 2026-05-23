"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import { uploadFile } from "@/features/communication/api/files.service";
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [open, conversation]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    let avatarFileId: string | undefined;

    // Upload avatar if selected
    if (avatarFile) {
      setIsUploading(true);
      try {
        const response = await uploadFile(avatarFile);
        const record = response as Record<string, unknown>;
        const data = (record.data ?? record.item ?? record) as Record<string, unknown>;
        avatarFileId = (data.id ?? data.fileId) as string | undefined;
      } catch {
        // Failed to upload — continue without avatar
      } finally {
        setIsUploading(false);
      }
    }

    const payload: UpdateConversationPayload = {
      title: title.trim() || null,
      description: description.trim() || null,
      isReadOnly,
      isPinned,
      ...(avatarFileId ? { avatarFileId } : {}),
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
            loading={isSubmitting || isUploading}
            onClick={() => void handleSubmit()}
          >
            {labels.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 transition hover:bg-slate-200"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-slate-400" />
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 transition hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
          <p className="text-xs text-slate-500">
            {labels.avatarFileId}
          </p>
        </div>

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

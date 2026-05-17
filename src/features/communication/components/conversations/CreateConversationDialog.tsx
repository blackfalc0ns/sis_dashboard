"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type {
  ConversationFormValues,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import type { ConversationType } from "@/features/communication/types/conversation.types";

export interface CreateConversationDialogLabels {
  createTitle: string;
  editTitle: string;
  title: string;
  type: string;
  description: string;
  academicYearId: string;
  termId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  avatarFileId: string;
  isReadOnly: string;
  isPinned: string;
  group: string;
  classroom: string;
  direct: string;
  cancel: string;
  create: string;
  save: string;
  titleRequired: string;
}

export interface CreateConversationDialogProps {
  open: boolean;
  labels: CreateConversationDialogLabels;
  conversation?: ConversationListItemModel | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ConversationFormValues) => Promise<void> | void;
}

function initialValues(
  conversation?: ConversationListItemModel | null,
): ConversationFormValues {
  return {
    title: conversation?.title ?? "",
    type: conversation?.type ?? "group",
    description:
      typeof conversation?.description === "string" ? conversation.description : "",
    avatarFileId:
      typeof conversation?.avatarFileId === "string" ? conversation.avatarFileId : "",
    academicYearId:
      typeof conversation?.academicYearId === "string"
        ? conversation.academicYearId
        : "",
    termId: typeof conversation?.termId === "string" ? conversation.termId : "",
    stageId: typeof conversation?.stageId === "string" ? conversation.stageId : "",
    gradeId: typeof conversation?.gradeId === "string" ? conversation.gradeId : "",
    sectionId:
      typeof conversation?.sectionId === "string" ? conversation.sectionId : "",
    classroomId:
      typeof conversation?.classroomId === "string"
        ? conversation.classroomId
        : "",
    subjectId:
      typeof conversation?.subjectId === "string" ? conversation.subjectId : "",
    isReadOnly: Boolean(conversation?.isReadOnly),
    isPinned: Boolean(conversation?.isPinned),
  };
}

interface ToggleRowProps {
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-sky-600"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export default function CreateConversationDialog({
  conversation,
  isSubmitting = false,
  labels,
  onClose,
  onSubmit,
  open,
}: CreateConversationDialogProps) {
  const initialFormValues = initialValues(conversation);
  const [values, setValues] = useState<ConversationFormValues>(() =>
    initialFormValues,
  );
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(conversation);

  const typeOptions = useMemo(
    () => [
      { value: "group", label: labels.group },
      { value: "classroom", label: labels.classroom },
      { value: "direct", label: labels.direct },
    ],
    [labels.classroom, labels.direct, labels.group],
  );

  const handleSubmit = async () => {
    if (!values.title?.trim()) {
      setError(labels.titleRequired);
      return;
    }

    setError(null);
    await onSubmit(values);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEditing ? labels.editTitle : labels.createTitle}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
          >
            {isEditing ? labels.save : labels.create}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <Input
          label={labels.title}
          value={values.title ?? ""}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
          error={error ?? undefined}
        />
        <Select
          label={labels.type}
          value={values.type ?? "group"}
          onChange={(value) =>
            setValues((current) => ({ ...current, type: value as ConversationType }))
          }
          options={typeOptions}
        />
        <TextArea
          label={labels.description}
          rows={3}
          value={values.description ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={labels.academicYearId}
            value={values.academicYearId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                academicYearId: event.target.value,
              }))
            }
          />
          <Input
            label={labels.termId}
            value={values.termId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                termId: event.target.value,
              }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={labels.stageId}
            value={values.stageId ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, stageId: event.target.value }))
            }
          />
          <Input
            label={labels.gradeId}
            value={values.gradeId ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, gradeId: event.target.value }))
            }
          />
          <Input
            label={labels.sectionId}
            value={values.sectionId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                sectionId: event.target.value,
              }))
            }
          />
          <Input
            label={labels.classroomId}
            value={values.classroomId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                classroomId: event.target.value,
              }))
            }
          />
          <Input
            label={labels.subjectId}
            value={values.subjectId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                subjectId: event.target.value,
              }))
            }
          />
          <Input
            label={labels.avatarFileId}
            value={values.avatarFileId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                avatarFileId: event.target.value,
              }))
            }
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            label={labels.isReadOnly}
            checked={values.isReadOnly}
            onChange={(checked) =>
              setValues((current) => ({ ...current, isReadOnly: checked }))
            }
          />
          <ToggleRow
            label={labels.isPinned}
            checked={values.isPinned}
            onChange={(checked) =>
              setValues((current) => ({ ...current, isPinned: checked }))
            }
          />
        </div>
      </div>
    </Modal>
  );
}

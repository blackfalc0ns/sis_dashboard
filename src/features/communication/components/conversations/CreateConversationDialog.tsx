"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  ConversationFormValues,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";

export interface CreateConversationDialogLabels {
  createTitle: string;
  editTitle: string;
  title: string;
  titleEn: string;
  titleAr: string;
  type: string;
  scopeType: string;
  scopeId: string;
  participantIds: string;
  participantIdsHelp: string;
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
    titleEn: conversation?.titleEn ?? "",
    titleAr: conversation?.titleAr ?? "",
    type: conversation?.type ?? "group",
    scopeType:
      typeof conversation?.scopeType === "string" ? conversation.scopeType : "",
    scopeId: typeof conversation?.scopeId === "string" ? conversation.scopeId : "",
    participantIds: Array.isArray(conversation?.participantIds)
      ? conversation.participantIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
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
  const [participantText, setParticipantText] = useState(
    initialFormValues.participantIds?.join(", ") ?? "",
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
    if (
      !values.title?.trim() &&
      !values.titleEn?.trim() &&
      !values.titleAr?.trim()
    ) {
      setError(labels.titleRequired);
      return;
    }

    const participantIds = participantText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await onSubmit({ ...values, participantIds });
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
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={labels.titleEn}
            value={values.titleEn ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                titleEn: event.target.value,
              }))
            }
          />
          <Input
            label={labels.titleAr}
            value={values.titleAr ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                titleAr: event.target.value,
              }))
            }
          />
        </div>
        <Select
          label={labels.type}
          value={values.type ?? "group"}
          onChange={(value) =>
            setValues((current) => ({ ...current, type: value }))
          }
          options={typeOptions}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={labels.scopeType}
            value={values.scopeType ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scopeType: event.target.value,
              }))
            }
          />
          <Input
            label={labels.scopeId}
            value={values.scopeId ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                scopeId: event.target.value,
              }))
            }
          />
        </div>
        <Input
          label={labels.participantIds}
          helperText={labels.participantIdsHelp}
          value={participantText}
          onChange={(event) => setParticipantText(event.target.value)}
        />
      </div>
    </Modal>
  );
}

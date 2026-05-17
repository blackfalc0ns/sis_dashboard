"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { Announcement } from "@/features/communication/types/announcement.types";
import type { AnnouncementFormValues } from "@/features/communication/hooks/useAnnouncements";

export interface AnnouncementEditorLabels {
  title: string;
  titleEn: string;
  titleAr: string;
  body: string;
  bodyEn: string;
  bodyAr: string;
  priority: string;
  normal: string;
  low: string;
  high: string;
  urgent: string;
  targetScopeType: string;
  targetScopeId: string;
  targetHelp: string;
  saveDraft: string;
  saveChanges: string;
  titleRequired: string;
  bodyRequired: string;
}

export interface AnnouncementEditorProps {
  labels: AnnouncementEditorLabels;
  announcement?: Announcement | null;
  isSubmitting?: boolean;
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit: (values: AnnouncementFormValues) => Promise<void> | void;
}

function initialValues(announcement?: Announcement | null): AnnouncementFormValues {
  const firstTarget = announcement?.targets?.[0];
  return {
    title: announcement?.title ?? "",
    titleEn: announcement?.titleEn ?? "",
    titleAr: announcement?.titleAr ?? "",
    body: announcement?.body ?? "",
    bodyEn: announcement?.bodyEn ?? "",
    bodyAr: announcement?.bodyAr ?? "",
    priority: announcement?.priority ?? "normal",
    targetScopeType: firstTarget?.scopeType ?? "",
    targetScopeId: firstTarget?.scopeId ?? "",
  };
}

export default function AnnouncementEditor({
  announcement,
  isSubmitting = false,
  labels,
  onSubmit,
  readOnly = false,
  submitLabel,
}: AnnouncementEditorProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(() =>
    initialValues(announcement),
  );
  const [error, setError] = useState<string | null>(null);
  const priorityOptions = useMemo(
    () => [
      { value: "normal", label: labels.normal },
      { value: "low", label: labels.low },
      { value: "high", label: labels.high },
      { value: "urgent", label: labels.urgent },
    ],
    [labels.high, labels.low, labels.normal, labels.urgent],
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

    if (!values.body?.trim() && !values.bodyEn?.trim() && !values.bodyAr?.trim()) {
      setError(labels.bodyRequired);
      return;
    }

    setError(null);
    await onSubmit(values);
  };

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Input
        label={labels.title}
        value={values.title ?? ""}
        disabled={readOnly}
        error={error ?? undefined}
        onChange={(event) =>
          setValues((current) => ({ ...current, title: event.target.value }))
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={labels.titleEn}
          value={values.titleEn ?? ""}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({ ...current, titleEn: event.target.value }))
          }
        />
        <Input
          label={labels.titleAr}
          value={values.titleAr ?? ""}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({ ...current, titleAr: event.target.value }))
          }
        />
      </div>
      <TextArea
        label={labels.body}
        value={values.body ?? ""}
        rows={5}
        disabled={readOnly}
        onChange={(event) =>
          setValues((current) => ({ ...current, body: event.target.value }))
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea
          label={labels.bodyEn}
          value={values.bodyEn ?? ""}
          rows={5}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({ ...current, bodyEn: event.target.value }))
          }
        />
        <TextArea
          label={labels.bodyAr}
          value={values.bodyAr ?? ""}
          rows={5}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({ ...current, bodyAr: event.target.value }))
          }
        />
      </div>
      <Select
        label={labels.priority}
        value={values.priority ?? "normal"}
        disabled={readOnly}
        options={priorityOptions}
        onChange={(value) =>
          setValues((current) => ({ ...current, priority: value }))
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={labels.targetScopeType}
          helperText={labels.targetHelp}
          value={values.targetScopeType ?? ""}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              targetScopeType: event.target.value,
            }))
          }
        />
        <Input
          label={labels.targetScopeId}
          value={values.targetScopeId ?? ""}
          disabled={readOnly}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              targetScopeId: event.target.value,
            }))
          }
        />
      </div>
      {!readOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {submitLabel ?? labels.saveDraft}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

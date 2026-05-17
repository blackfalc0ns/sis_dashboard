"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import {
  policyToFormValues,
  type CommunicationPolicyFormValues,
} from "@/features/communication/hooks/useCommunicationPolicy";
import type { CommunicationPolicy } from "@/features/communication/types/communication.types";

export interface CommunicationPolicyFormLabels {
  title: string;
  save: string;
  enabled: string;
  adminToAnyone: string;
  directStaffToStaff: string;
  teacherCreatedGroups: string;
  attachments: string;
  reactions: string;
  messageEdit: string;
  messageDelete: string;
  readReceipts: string;
  deliveryReceipts: string;
  onlinePresence: string;
  maxGroupMembers: string;
  maxMessageLength: string;
  maxAttachmentSizeMb: string;
  retentionDays: string;
  moderationMode: string;
  standard: string;
  relaxed: string;
  strict: string;
  studentDirectMode: string;
  studentDirectDisabled: string;
  studentDirectSameClassroom: string;
  studentDirectSameGrade: string;
  studentDirectSameSchool: string;
  studentDirectAnySchoolUser: string;
  studentDirectApprovalRequired: string;
  metadata: string;
  metadataHelp: string;
  invalidMetadata: string;
}

export interface CommunicationPolicyFormProps {
  policy?: CommunicationPolicy | null;
  labels: CommunicationPolicyFormLabels;
  isSaving?: boolean;
  onSubmit: (values: CommunicationPolicyFormValues) => Promise<void> | void;
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

export default function CommunicationPolicyForm({
  isSaving,
  labels,
  onSubmit,
  policy,
}: CommunicationPolicyFormProps) {
  const [values, setValues] = useState<CommunicationPolicyFormValues>(() =>
    policyToFormValues(policy ?? null),
  );
  const [error, setError] = useState<string | null>(null);
  const moderationOptions = [
    { value: "standard", label: labels.standard },
    { value: "relaxed", label: labels.relaxed },
    { value: "strict", label: labels.strict },
  ];
  const studentDirectModeOptions = [
    { value: "disabled", label: labels.studentDirectDisabled },
    { value: "same_classroom", label: labels.studentDirectSameClassroom },
    { value: "same_grade", label: labels.studentDirectSameGrade },
    { value: "same_school", label: labels.studentDirectSameSchool },
    { value: "any_school_user", label: labels.studentDirectAnySchoolUser },
    { value: "approval_required", label: labels.studentDirectApprovalRequired },
  ];

  const setBoolean = (
    key: keyof CommunicationPolicyFormValues,
    checked: boolean,
  ) => {
    setValues((current) => ({ ...current, [key]: checked }));
  };

  const handleSubmit = async () => {
    if (values.metadataText?.trim()) {
      try {
        const parsed = JSON.parse(values.metadataText) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setError(labels.invalidMetadata);
          return;
        }
      } catch {
        setError(labels.invalidMetadata);
        return;
      }
    }

    setError(null);
    await onSubmit(values);
  };

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
        <Button
          type="button"
          loading={isSaving}
          onClick={() => void handleSubmit()}
        >
          {labels.save}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow
          label={labels.enabled}
          checked={values.isEnabled}
          onChange={(checked) => setBoolean("isEnabled", checked)}
        />
        <ToggleRow
          label={labels.adminToAnyone}
          checked={values.allowAdminToAnyone}
          onChange={(checked) => setBoolean("allowAdminToAnyone", checked)}
        />
        <ToggleRow
          label={labels.directStaffToStaff}
          checked={values.allowDirectStaffToStaff}
          onChange={(checked) => setBoolean("allowDirectStaffToStaff", checked)}
        />
        <ToggleRow
          label={labels.teacherCreatedGroups}
          checked={values.allowTeacherCreatedGroups}
          onChange={(checked) => setBoolean("allowTeacherCreatedGroups", checked)}
        />
        <ToggleRow
          label={labels.attachments}
          checked={values.allowAttachments}
          onChange={(checked) => setBoolean("allowAttachments", checked)}
        />
        <ToggleRow
          label={labels.reactions}
          checked={values.allowReactions}
          onChange={(checked) => setBoolean("allowReactions", checked)}
        />
        <ToggleRow
          label={labels.messageEdit}
          checked={values.allowMessageEdit}
          onChange={(checked) => setBoolean("allowMessageEdit", checked)}
        />
        <ToggleRow
          label={labels.messageDelete}
          checked={values.allowMessageDelete}
          onChange={(checked) => setBoolean("allowMessageDelete", checked)}
        />
        <ToggleRow
          label={labels.readReceipts}
          checked={values.allowReadReceipts}
          onChange={(checked) => setBoolean("allowReadReceipts", checked)}
        />
        <ToggleRow
          label={labels.deliveryReceipts}
          checked={values.allowDeliveryReceipts}
          onChange={(checked) => setBoolean("allowDeliveryReceipts", checked)}
        />
        <ToggleRow
          label={labels.onlinePresence}
          checked={values.allowOnlinePresence}
          onChange={(checked) => setBoolean("allowOnlinePresence", checked)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          type="number"
          label={labels.maxGroupMembers}
          value={values.maxGroupMembers ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              maxGroupMembers: event.target.value,
            }))
          }
        />
        <Input
          type="number"
          label={labels.maxMessageLength}
          value={values.maxMessageLength ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              maxMessageLength: event.target.value,
            }))
          }
        />
        <Input
          type="number"
          label={labels.maxAttachmentSizeMb}
          value={values.maxAttachmentSizeMb ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              maxAttachmentSizeMb: event.target.value,
            }))
          }
        />
        <Input
          type="number"
          label={labels.retentionDays}
          value={values.retentionDays ?? ""}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              retentionDays: event.target.value,
            }))
          }
        />
        <Select
          label={labels.moderationMode}
          value={values.moderationMode ?? "standard"}
          options={moderationOptions}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              moderationMode: value as CommunicationPolicyFormValues["moderationMode"],
            }))
          }
        />
        <Select
          label={labels.studentDirectMode}
          value={values.studentDirectMode ?? "disabled"}
          options={studentDirectModeOptions}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              studentDirectMode:
                value as CommunicationPolicyFormValues["studentDirectMode"],
            }))
          }
        />
      </div>

      <TextArea
        label={labels.metadata}
        helperText={labels.metadataHelp}
        value={values.metadataText ?? ""}
        error={error ?? undefined}
        rows={5}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            metadataText: event.target.value,
          }))
        }
      />
    </section>
  );
}

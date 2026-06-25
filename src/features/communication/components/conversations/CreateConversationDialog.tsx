"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import AcademicYearSelect from "@/features/communication/components/selectors/AcademicYearSelect";
import ClassroomSelect from "@/features/communication/components/selectors/ClassroomSelect";
import GradeSelect from "@/features/communication/components/selectors/GradeSelect";
import SectionSelect from "@/features/communication/components/selectors/SectionSelect";
import StageSelect from "@/features/communication/components/selectors/StageSelect";
import SubjectSelect from "@/features/communication/components/selectors/SubjectSelect";
import TermSelect from "@/features/communication/components/selectors/TermSelect";
import { uploadFile } from "@/features/communication/api/files.service";
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
  classroomRequired?: string;
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
      typeof conversation?.description === "string"
        ? conversation.description
        : "",
    avatarFileId:
      typeof conversation?.avatarFileId === "string"
        ? conversation.avatarFileId
        : "",
    academicYearId:
      typeof conversation?.academicYearId === "string"
        ? conversation.academicYearId
        : "",
    termId: typeof conversation?.termId === "string" ? conversation.termId : "",
    stageId:
      typeof conversation?.stageId === "string" ? conversation.stageId : "",
    gradeId:
      typeof conversation?.gradeId === "string" ? conversation.gradeId : "",
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
        className="h-4 w-4 rounded border-slate-300 text-primary-600"
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
  const [values, setValues] = useState<ConversationFormValues>(
    () => initialFormValues,
  );
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const isEditing = Boolean(conversation);
  const showAcademicSelectors =
    values.type === "group" || values.type === "classroom";

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
    if (values.type === "classroom" && !values.classroomId?.trim()) {
      setError(labels.classroomRequired ?? labels.classroomId);
      return;
    }

    setError(null);

    // Upload avatar if a file was selected
    let avatarFileId = values.avatarFileId;
    if (avatarFile) {
      try {
        const response = await uploadFile(avatarFile);
        const record = response as Record<string, unknown>;
        const data = (record.data ?? record.item ?? record) as Record<
          string,
          unknown
        >;
        avatarFileId = ((data.id ?? data.fileId) as string) || avatarFileId;
      } catch {
        // Continue without avatar if upload fails
      }
    }

    await onSubmit({ ...values, avatarFileId });
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
          error={error === labels.titleRequired ? error : undefined}
        />
        <Select
          label={labels.type}
          value={values.type ?? "group"}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              type: value as ConversationType,
              ...(value === "direct"
                ? {
                    academicYearId: "",
                    termId: "",
                    stageId: "",
                    gradeId: "",
                    sectionId: "",
                    classroomId: "",
                    subjectId: "",
                  }
                : {}),
            }))
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
        {showAcademicSelectors ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <AcademicYearSelect
                label={labels.academicYearId}
                value={values.academicYearId ?? ""}
                onChange={(academicYearId) =>
                  setValues((current) => ({
                    ...current,
                    academicYearId,
                    termId: "",
                    stageId: "",
                    gradeId: "",
                    sectionId: "",
                    classroomId: "",
                  }))
                }
              />
              <TermSelect
                label={labels.termId}
                value={values.termId ?? ""}
                academicYearId={values.academicYearId}
                onChange={(termId) =>
                  setValues((current) => ({
                    ...current,
                    termId,
                    stageId: "",
                    gradeId: "",
                    sectionId: "",
                    classroomId: "",
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <StageSelect
                label={labels.stageId}
                value={values.stageId ?? ""}
                academicYearId={values.academicYearId}
                termId={values.termId}
                onChange={(stageId) =>
                  setValues((current) => ({
                    ...current,
                    stageId,
                    gradeId: "",
                    sectionId: "",
                    classroomId: "",
                  }))
                }
              />
              <GradeSelect
                label={labels.gradeId}
                value={values.gradeId ?? ""}
                academicYearId={values.academicYearId}
                termId={values.termId}
                stageId={values.stageId}
                onChange={(gradeId) =>
                  setValues((current) => ({
                    ...current,
                    gradeId,
                    sectionId: "",
                    classroomId: "",
                  }))
                }
              />
              <SectionSelect
                label={labels.sectionId}
                value={values.sectionId ?? ""}
                academicYearId={values.academicYearId}
                termId={values.termId}
                gradeId={values.gradeId}
                onChange={(sectionId) =>
                  setValues((current) => ({
                    ...current,
                    sectionId,
                    classroomId: "",
                  }))
                }
              />
              <ClassroomSelect
                label={labels.classroomId}
                value={values.classroomId ?? ""}
                academicYearId={values.academicYearId}
                termId={values.termId}
                sectionId={values.sectionId}
                error={
                  values.type === "classroom" &&
                  error === labels.classroomRequired
                    ? error
                    : undefined
                }
                onChange={(classroomId) =>
                  setValues((current) => ({ ...current, classroomId }))
                }
              />
              <SubjectSelect
                label={labels.subjectId}
                value={values.subjectId ?? ""}
                onChange={(subjectId) =>
                  setValues((current) => ({ ...current, subjectId }))
                }
              />
              <AvatarUploadField
                label={labels.avatarFileId}
                preview={avatarPreview}
                onFileSelect={(file) => {
                  setAvatarFile(file);
                  const reader = new FileReader();
                  reader.onload = () =>
                    setAvatarPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </>
        ) : null}
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

function AvatarUploadField({
  label,
  onFileSelect,
  preview,
}: {
  label: string;
  onFileSelect: (file: File) => void;
  preview: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onFileSelect(file);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 transition hover:bg-slate-200"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5 text-slate-400" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="text-xs text-slate-500">
          {preview ? "✓ Selected" : "Click to upload"}
        </span>
      </div>
    </div>
  );
}

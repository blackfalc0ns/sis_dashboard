"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Modal, Select } from "@/components/ui";
import TeacherFormSections from "./TeacherFormSections";
import { emptyCreateTeacherForm, createFormToRequest } from "@/features/teachers/utils/teacherFormMappers";
import { validateTeacherForm } from "@/features/teachers/utils/teacherValidation";
import { toTeacherUiError } from "@/features/teachers/utils/teacherErrors";
import type {
  CreateTeacherFormState,
  CreateTeacherRequest,
  TeacherFormErrors,
} from "@/features/teachers/types/index";

interface CreateTeacherDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTeacherRequest) => Promise<void>;
}

export default function CreateTeacherDialog(props: CreateTeacherDialogProps) {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const preferredLanguage = locale === "ar" ? "AR" : "EN";
  const [form, setForm] = useState<CreateTeacherFormState>(() =>
    emptyCreateTeacherForm(preferredLanguage),
  );
  const [errors, setErrors] = useState<TeacherFormErrors>({});

  const submit = async () => {
    const validationErrors = validateTeacherForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      await props.onSubmit(createFormToRequest(form));
    } catch (submissionError) {
      const uiError = toTeacherUiError(submissionError);
      setErrors({ ...uiError.fieldErrors, form: uiError.message });
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("dialog.create_title")}
      size="xl"
      footer={<><Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>{t("actions.cancel")}</Button><Button onClick={() => void submit()} loading={props.isSubmitting}>{t("dialog.create_action")}</Button></>}
    >
      <div className="space-y-4">
        {errors.form ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}
        <Select label={t("fields.employment_status")} value={form.employmentStatus} onChange={(employmentStatus) => setForm({ ...form, employmentStatus: employmentStatus as "ACTIVE" | "INACTIVE" })} options={[{ value: "INACTIVE", label: t("statuses.inactive") }, { value: "ACTIVE", label: t("statuses.active") }]} required />
        <TeacherFormSections form={form} errors={errors} onChange={(nextForm) => setForm({ ...nextForm, employmentStatus: form.employmentStatus })} />
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("messages.activation_caveat")}</p>
      </div>
    </Modal>
  );
}

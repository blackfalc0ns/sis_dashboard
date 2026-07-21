"use client";

import { useTranslations } from "next-intl";
import {
  BilingualTextField,
  DatePicker,
  Input,
  Select,
  TextArea,
} from "@/components/ui";
import type {
  EditTeacherFormState,
  TeacherFormErrors,
  TeacherWorkDay,
} from "@/features/teachers/types/index";

const workDays: TeacherWorkDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

interface TeacherFormSectionsProps {
  form: EditTeacherFormState;
  errors: TeacherFormErrors;
  onChange: (form: EditTeacherFormState) => void;
  showIdentity?: boolean;
}

type SectionProps = TeacherFormSectionsProps & {
  requiredError: (field: string) => string | undefined;
};

function IdentitySection({ form, onChange, requiredError }: SectionProps) {
  const t = useTranslations("teachers");
  const updateIdentity = (patch: Partial<EditTeacherFormState["identity"]>) =>
    onChange({ ...form, identity: { ...form.identity, ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.identity_section")}</h3>
      <div className="flex gap-4">
        {(["username", "loginEmail"] as const).map((identityMode) => (
          <label key={identityMode} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={form.identity.identityMode === identityMode} onChange={() => updateIdentity({ identityMode })} />
            {t(`form.identity_modes.${identityMode}`)}
          </label>
        ))}
      </div>
      {form.identity.identityMode === "username" ? (
        <Input label={t("fields.username")} value={form.identity.username} onChange={(event) => updateIdentity({ username: event.target.value })} error={requiredError("username")} required />
      ) : (
        <Input type="email" label={t("fields.login_email")} value={form.identity.loginEmail} onChange={(event) => updateIdentity({ loginEmail: event.target.value })} error={requiredError("loginEmail")} required />
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="email" label={t("fields.contact_email")} value={form.identity.contactEmail} onChange={(event) => updateIdentity({ contactEmail: event.target.value })} />
        <Input label={t("fields.phone")} value={form.identity.phone} onChange={(event) => updateIdentity({ phone: event.target.value })} />
      </div>
    </section>
  );
}

function ProfileSection({ form, onChange, requiredError }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.profile_section")}</h3>
      <Input label={t("fields.code")} value={form.profile.teacherCode} onChange={(event) => updateProfile({ teacherCode: event.target.value.toUpperCase().replace(/\s+/g, "") })} error={requiredError("teacherCode")} helperText={form.profile.teacherCode || undefined} required />
      <div className="grid gap-3 md:grid-cols-2">
        <BilingualTextField label={t("fields.first_name")} value={{ ar: form.profile.firstNameAr, en: form.profile.firstNameEn }} onChange={(names) => updateProfile({ firstNameAr: names.ar, firstNameEn: names.en })} errors={{ ar: requiredError("firstNameAr"), en: requiredError("firstNameEn") }} />
        <BilingualTextField label={t("fields.last_name")} value={{ ar: form.profile.lastNameAr, en: form.profile.lastNameEn }} onChange={(names) => updateProfile({ lastNameAr: names.ar, lastNameEn: names.en })} errors={{ ar: requiredError("lastNameAr"), en: requiredError("lastNameEn") }} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Select label={t("fields.preferred_language")} value={form.profile.preferredDisplayLanguage} onChange={(preferredDisplayLanguage) => updateProfile({ preferredDisplayLanguage: preferredDisplayLanguage as "AR" | "EN" })} options={[{ value: "AR", label: t("languages.ar") }, { value: "EN", label: t("languages.en") }]} error={requiredError("preferredDisplayLanguage")} required />
        <Select label={t("fields.gender")} value={form.profile.gender} onChange={(gender) => updateProfile({ gender: gender as "MALE" | "FEMALE" })} options={[{ value: "MALE", label: t("gender.male") }, { value: "FEMALE", label: t("gender.female") }]} error={requiredError("gender")} required />
      </div>
    </section>
  );
}

function EmploymentSection({ form, errors, onChange }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.employment_section")}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label={t("fields.department")} value={form.profile.department} onChange={(event) => updateProfile({ department: event.target.value })} />
        <Input label={t("fields.specialization")} value={form.profile.specialization} onChange={(event) => updateProfile({ specialization: event.target.value })} />
        <Select label={t("fields.employment_type")} value={form.profile.employmentType} onChange={(employmentType) => updateProfile({ employmentType: employmentType as EditTeacherFormState["profile"]["employmentType"] })} options={[{ value: "FULL_TIME", label: t("employment_types.full_time") }, { value: "PART_TIME", label: t("employment_types.part_time") }, { value: "CONTRACT", label: t("employment_types.contract") }]} />
        <Input type="number" min={0} max={60} label={t("fields.experience_years")} value={form.profile.experienceYears} onChange={(event) => updateProfile({ experienceYears: event.target.value })} error={errors.experienceYears ? t("validation.experience_range") : undefined} />
        <DatePicker label={t("fields.hire_date")} value={form.profile.hireDate ? new Date(`${form.profile.hireDate}T00:00:00`) : null} onChange={(date) => updateProfile({ hireDate: date ? date.toISOString().slice(0, 10) : "" })} />
      </div>
    </section>
  );
}

function ScheduleSection({ form, errors, onChange }: SectionProps) {
  const t = useTranslations("teachers");
  const updateSchedule = (patch: Partial<EditTeacherFormState["schedule"]>) =>
    onChange({ ...form, schedule: { ...form.schedule, ...patch } });
  const toggleWorkDay = (day: TeacherWorkDay) => {
    const selected = form.schedule.workingDays.includes(day);
    updateSchedule({ workingDays: selected ? form.schedule.workingDays.filter((current) => current !== day) : [...form.schedule.workingDays, day] });
  };

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-gray-900">{t("form.schedule_section")}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {workDays.map((day) => <label key={day} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.schedule.workingDays.includes(day)} onChange={() => toggleWorkDay(day)} />{t(`work_days.${day.toLowerCase()}`)}</label>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input type="time" label={t("fields.work_start_time")} value={form.schedule.workStartTime} onChange={(event) => updateSchedule({ workStartTime: event.target.value })} error={errors.workTime ? t("validation.work_time_pair") : undefined} />
        <Input type="time" label={t("fields.work_end_time")} value={form.schedule.workEndTime} onChange={(event) => updateSchedule({ workEndTime: event.target.value })} error={errors.workTime ? t("validation.work_time_pair") : undefined} />
      </div>
    </section>
  );
}

function NotesSection({ form, onChange }: SectionProps) {
  const t = useTranslations("teachers");
  const updateProfile = (patch: Partial<EditTeacherFormState["profile"]>) =>
    onChange({ ...form, profile: { ...form.profile, ...patch } });

  return (
    <section className="grid gap-3 md:grid-cols-2">
      <TextArea label={t("fields.notes_ar")} dir="rtl" maxLength={500} value={form.profile.notesAr} onChange={(event) => updateProfile({ notesAr: event.target.value })} />
      <TextArea label={t("fields.notes_en")} dir="ltr" maxLength={500} value={form.profile.notesEn} onChange={(event) => updateProfile({ notesEn: event.target.value })} />
    </section>
  );
}

export default function TeacherFormSections({ showIdentity = true, ...props }: TeacherFormSectionsProps) {
  const t = useTranslations("teachers");
  const sectionProps: SectionProps = {
    ...props,
    requiredError: (field) => props.errors[field] ? t("validation.required") : undefined,
  };

  return (
    <div className="space-y-6">
      {showIdentity ? <IdentitySection {...sectionProps} /> : null}
      <ProfileSection {...sectionProps} />
      <EmploymentSection {...sectionProps} />
      <ScheduleSection {...sectionProps} />
      <NotesSection {...sectionProps} />
    </div>
  );
}

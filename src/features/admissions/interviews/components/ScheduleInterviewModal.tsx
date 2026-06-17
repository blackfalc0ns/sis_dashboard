// FILE: src/features/admissions/interviews/components/ScheduleInterviewModal.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import { Input, Select, TextArea, type SelectOption } from "@/components/ui/input";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";

export interface ScheduleInterviewFormData {
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  date: string;
  time: string;
  interviewerUserId: string;
  interviewerName: string;
  interviewer: string;
  interviewerPhone: string;
  location: string;
  duration: string;
  notes: string;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleInterviewFormData) => Promise<void> | void;
  studentName: string;
  guardianName?: string;
  guardianPhone?: string;
}

const FORM_ID = "schedule-interview-form";

const formatUserOptionLabel = (user: SettingsUserRecord) =>
  user.email ? `${user.fullName} (${user.email})` : user.fullName;

function isTeacherRole(role: RoleDefinition) {
  const roleKey = (role.key || "").toLowerCase();
  const roleName = (role.name || "").toLowerCase();
  return roleKey === "teacher" || roleName === "teacher";
}

function createInitialFormData(
  studentName: string,
  guardianName: string,
  guardianPhone: string,
): ScheduleInterviewFormData {
  return {
    studentName,
    guardianName,
    guardianPhone,
    date: "",
    time: "",
    interviewerUserId: "",
    interviewerName: "",
    interviewer: "",
    interviewerPhone: "",
    location: "",
    duration: "30",
    notes: "",
  };
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  guardianName = "",
  guardianPhone = "",
}: ScheduleInterviewModalProps) {
  const t = useTranslations("admissions.schedule_interview");
  const [teacherUsers, setTeacherUsers] = useState<SettingsUserRecord[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleInterviewFormData>(() =>
    createInitialFormData(studentName, guardianName, guardianPhone),
  );

  const activeTeacherUsers = useMemo(
    () =>
      teacherUsers.filter(
        (user) => (user.status || "").toLowerCase() === "active",
      ),
    [teacherUsers],
  );
  const teacherOptions = useMemo<SelectOption[]>(
    () =>
      activeTeacherUsers.map((teacherUser) => ({
        value: teacherUser.id,
        label: formatUserOptionLabel(teacherUser),
        searchText: `${teacherUser.fullName} ${teacherUser.email || ""}`,
      })),
    [activeTeacherUsers],
  );
  const durationOptions = useMemo<SelectOption[]>(
    () =>
      [15, 30, 45, 60, 90, 120, 150, 180].map((minutes) => ({
        value: String(minutes),
        label: t("minutes", { count: minutes }),
      })),
    [t],
  );

  useEffect(() => {
    if (!isOpen) return;

    setFormData(createInitialFormData(studentName, guardianName, guardianPhone));
    setValidationError(null);
    setIsSubmitting(false);
  }, [guardianName, guardianPhone, isOpen, studentName]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoadingTeachers(true);
      setTeachersError(null);

      try {
        const rolesResult = await fetchSettingsRoles();
        const teacherRole = rolesResult.items.find(isTeacherRole);
        if (!teacherRole) {
          throw new Error("teacher_role_not_found");
        }

        const usersResult = await fetchSettingsUsers({
          roleId: teacherRole.id,
          status: "active",
        });
        if (!cancelled) {
          setTeacherUsers(usersResult.items);
        }
      } catch (error) {
        console.error("Failed to load interviewers:", error);
        if (!cancelled) {
          setTeacherUsers([]);
          setTeachersError(t("teachers_load_failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeachers(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const updateFormData = (updates: Partial<ScheduleInterviewFormData>) => {
    setFormData((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!formData.interviewerUserId) {
      setValidationError(t("select_interviewer"));
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      setValidationError(t("schedule_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewerChange = (interviewerUserId: string) => {
    const teacherUser = activeTeacherUsers.find(
      (item) => item.id === interviewerUserId,
    );

    updateFormData({
      interviewerUserId: teacherUser?.id || "",
      interviewerName: teacherUser?.fullName || "",
      interviewer: teacherUser?.fullName || "",
      interviewerPhone: teacherUser?.email || "",
    });
    setValidationError(null);
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {t("cancel")}
      </button>
      <button
        type="submit"
        form={FORM_ID}
        disabled={isSubmitting || isLoadingTeachers}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-hover disabled:opacity-50"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={`${t("student")}: ${studentName}`}
      size="lg"
      footer={footer}
      icon={<Calendar className="h-6 w-6" />}
      variant="confirm"
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("student_guardian_info")}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("student_name")}
              type="text"
              value={formData.studentName}
              required
              readOnly
            />

            <Input
              label={t("guardian_name")}
              type="text"
              value={formData.guardianName}
              onChange={(event) =>
                updateFormData({ guardianName: event.target.value })
              }
              placeholder={t("guardian_name_placeholder")}
            />

            <Input
              label={t("guardian_phone")}
              type="tel"
              value={formData.guardianPhone}
              onChange={(event) =>
                updateFormData({ guardianPhone: event.target.value })
              }
              placeholder={t("guardian_phone_placeholder")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("interview_details")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("date")}
              type="date"
              value={formData.date}
              onChange={(event) => updateFormData({ date: event.target.value })}
              required
            />

            <Input
              label={t("time")}
              type="time"
              value={formData.time}
              onChange={(event) => updateFormData({ time: event.target.value })}
              required
            />

            <Select
              label={t("interviewer")}
              value={formData.interviewerUserId}
              onChange={handleInterviewerChange}
              options={teacherOptions}
              placeholder={
                isLoadingTeachers
                  ? t("loading_teachers")
                  : activeTeacherUsers.length === 0
                    ? t("no_active_teachers")
                    : t("select_interviewer")
              }
              required
              disabled={isLoadingTeachers || activeTeacherUsers.length === 0}
              searchable
              error={validationError || teachersError || undefined}
              noOptionsText={t("no_active_teachers")}
            />

            <Input
              label={t("interviewer_phone")}
              type="email"
              value={formData.interviewerPhone}
              placeholder={t("interviewer_email_placeholder")}
              readOnly
            />

            <Input
              label={t("location")}
              type="text"
              value={formData.location}
              onChange={(event) =>
                updateFormData({ location: event.target.value })
              }
              placeholder={t("location_placeholder")}
              required
            />

            <Select
              label={t("duration")}
              value={formData.duration}
              onChange={(duration) => updateFormData({ duration })}
              options={durationOptions}
            />
          </div>
        </div>

        <TextArea
          label={t("notes")}
          value={formData.notes}
          onChange={(event) => updateFormData({ notes: event.target.value })}
          rows={3}
          resize="none"
          placeholder={t("notes_placeholder")}
        />
      </form>
    </Modal>
  );
}

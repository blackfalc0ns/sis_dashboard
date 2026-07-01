// FILE: src/components/students-guardians/profile-tabs/MedicalTab.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Edit2, Save, X } from "lucide-react";
import type {
  Student,
  StudentMedicalProfile,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useTranslations } from "next-intl";
import { Button, TextArea } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface MedicalTabProps {
  student: Student;
}

export default function MedicalTab({ student }: MedicalTabProps) {
  const t = useTranslations("students_guardians.profile.medical");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalData, setMedicalData] = useState<StudentMedicalProfile>({
    studentId: student.id,
    notes: "",
  });

  const loadMedicalProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await studentsService.fetchStudentMedicalProfile(student.id);
      setMedicalData(profile || { studentId: student.id, notes: "" });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load medical profile.",
      );
      setMedicalData({ studentId: student.id, notes: "" });
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    void loadMedicalProfile();
  }, [loadMedicalProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await studentsService.upsertStudentMedicalProfile(
        student.id,
        medicalData,
      );
      setMedicalData(saved);
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save medical profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    void loadMedicalProfile();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            {t("edit")}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t("save")}
            </Button>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <PartialLoader size={24} />
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Medical Notes */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          {t("medical_notes")}
        </h3>
        <TextArea
          value={medicalData.notes || ""}
          onChange={(e) =>
            setMedicalData({ ...medicalData, notes: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder={t("enter_notes")}
          variant={isEditing ? "default" : "filled"}
        />
      </div>
    </div>
  );
}

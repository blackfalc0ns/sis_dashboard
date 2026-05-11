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
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {t("edit")}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {t("save")}
            </button>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading medical profile...
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
        <textarea
          value={medicalData.notes || ""}
          onChange={(e) =>
            setMedicalData({ ...medicalData, notes: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder={t("enter_notes")}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
            isEditing
              ? "border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>
    </div>
  );
}

// FILE: src/components/students-guardians/profile-tabs/MedicalTab.tsx

"use client";

import { useState } from "react";
import { Heart, AlertTriangle, FileText, Edit2, Save, X } from "lucide-react";
import { Student } from "@/types/students";
import { getStudentMedicalProfile } from "@/services/studentsService";
import { useTranslations } from "next-intl";

interface MedicalTabProps {
  student: Student;
}

export default function MedicalTab({ student }: MedicalTabProps) {
  const t = useTranslations("students_guardians.profile.medical");
  const medicalProfile = getStudentMedicalProfile(student.student_id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [medicalData, setMedicalData] = useState(
    medicalProfile || {
      studentId: student.student_id || "",
      blood_type: "",
      allergies: "",
      notes: "",
      emergency_plan: "",
    },
  );

  const handleSave = () => {
    // TODO: Implement save functionality via API
    setIsEditing(false);
  };

  const handleCancel = () => {
    setMedicalData(
      medicalProfile || {
        studentId: student.student_id || "",
        blood_type: "",
        allergies: "",
        notes: "",
        emergency_plan: "",
      },
    );
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
            className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {t("save")}
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {medicalData.allergies && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                {t("allergy_alert")}
              </h3>
              <p className="text-sm text-red-700">
                {t("allergy_message", { allergies: medicalData.allergies })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blood Type */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          {t("blood_type")}
        </h3>
        <div className="max-w-xs">
          {isEditing ? (
            <input
              type="text"
              value={medicalData.blood_type || ""}
              onChange={(e) =>
                setMedicalData({ ...medicalData, blood_type: e.target.value })
              }
              placeholder="e.g., A+, O-, B+"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            />
          ) : (
            <p className="text-sm text-gray-700">
              {medicalData.blood_type || t("not_specified")}
            </p>
          )}
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("allergies")}
        </h3>
        {isEditing ? (
          <textarea
            value={medicalData.allergies || ""}
            onChange={(e) =>
              setMedicalData({
                ...medicalData,
                allergies: e.target.value,
              })
            }
            rows={2}
            placeholder={t("enter_allergies")}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
          />
        ) : (
          <p className="text-sm text-gray-700">
            {medicalData.allergies || t("no_allergies")}
          </p>
        )}
      </div>

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
              ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>

      {/* Emergency Plan */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          {t("emergency_plan")}
        </h3>
        <textarea
          value={medicalData.emergency_plan || ""}
          onChange={(e) =>
            setMedicalData({ ...medicalData, emergency_plan: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder={t("enter_plan")}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
            isEditing
              ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>
    </div>
  );
}

// FILE: src/components/students-guardians/profile-tabs/PersonalInfoTab.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { Edit2, Save, X, AlertTriangle } from "lucide-react";
import { Student, RiskFlag } from "@/types/students";
import { getRiskFlagColor, getRiskFlagLabel } from "@/utils/studentUtils";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { getEnrollmentByStudentId } from "@/data/mockEnrollments";

interface PersonalInfoTabProps {
  student: Student;
}

export default function PersonalInfoTab({ student }: PersonalInfoTabProps) {
  const t = useTranslations("students_guardians.profile.personal_info");
  const params = useParams();
  const locale = params.lang as string;

  // Get enrollment data for grade, section, and academic year
  const enrollment = useMemo(
    () => getEnrollmentByStudentId(student.id),
    [student.id],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    full_name_en: student.full_name_en || student.name,
    full_name_ar: student.full_name_ar,
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    nationality: student.nationality,
    grade: enrollment?.grade || student.grade || "",
    section: enrollment?.section || student.section || "",
    status: student.status,
    enrollment_year:
      enrollment?.academicYear || student.enrollment_year?.toString() || "",
    address_line: student.contact?.address_line || "",
    city: student.contact?.city || "",
    district: student.contact?.district || "",
    student_phone: student.contact?.student_phone || "",
    student_email: student.contact?.student_email || "",
  });

  // Update form data when enrollment changes
  useEffect(() => {
    if (enrollment) {
      setFormData((prev) => ({
        ...prev,
        grade: enrollment.grade || prev.grade,
        section: enrollment.section || prev.section,
        enrollment_year: enrollment.academicYear || prev.enrollment_year,
      }));
    }
  }, [enrollment]);

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: student.name,
      full_name_en: student.full_name_en || student.name,
      full_name_ar: student.full_name_ar,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      nationality: student.nationality,
      grade: enrollment?.grade || student.grade || "",
      section: enrollment?.section || student.section || "",
      status: student.status,
      enrollment_year:
        enrollment?.academicYear || student.enrollment_year?.toString() || "",
      address_line: student.contact?.address_line || "",
      city: student.contact?.city || "",
      district: student.contact?.district || "",
      student_phone: student.contact?.student_phone || "",
      student_email: student.contact?.student_email || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
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

      {/* Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Risk Flags Alert */}
        {student.risk_flags && student.risk_flags.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">
                  {t("risk_flags_detected")}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {student.risk_flags.map((flag: RiskFlag) => (
                    <span
                      key={flag}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
                    >
                      {getRiskFlagLabel(flag)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  {t("risk_flags_message")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("student_id")}
            </label>
            <input
              type="text"
              value={student.student_id}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("cannot_be_changed")}
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("full_name")}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Full Name (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("full_name_en")}
            </label>
            <input
              type="text"
              value={formData.full_name_en}
              onChange={(e) =>
                setFormData({ ...formData, full_name_en: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Full Name (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("full_name_ar")}
            </label>
            <input
              type="text"
              value={formData.full_name_ar}
              onChange={(e) =>
                setFormData({ ...formData, full_name_ar: e.target.value })
              }
              disabled={!isEditing}
              dir="rtl"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("gender")}
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Male">{t("male")}</option>
              <option value="Female">{t("female")}</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("date_of_birth")}
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("nationality")}
            </label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) =>
                setFormData({ ...formData, nationality: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("grade")}
            </label>
            <select
              value={formData.grade}
              onChange={(e) =>
                setFormData({ ...formData, grade: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("section")}
            </label>
            <select
              value={formData.section}
              onChange={(e) =>
                setFormData({ ...formData, section: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("status")}
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Student["status"],
                })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Enrollment Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("enrollment_year")}
            </label>
            <input
              type="text"
              value={formData.enrollment_year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  enrollment_year: e.target.value,
                })
              }
              disabled={!isEditing}
              placeholder="2026-2027"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                isEditing
                  ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            />
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("created_at")}
            </label>
            <input
              type="text"
              value={new Date(
                student.created_at ?? student.submittedDate,
              ).toLocaleString()}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("contact_information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("address")}
              </label>
              <input
                type="text"
                value={formData.address_line}
                onChange={(e) =>
                  setFormData({ ...formData, address_line: e.target.value })
                }
                disabled={!isEditing}
                placeholder={t("address_placeholder")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("city")}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("district")}
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            {/* Student Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("student_phone")}
              </label>
              <input
                type="tel"
                value={formData.student_phone}
                onChange={(e) =>
                  setFormData({ ...formData, student_phone: e.target.value })
                }
                disabled={!isEditing}
                placeholder="+966 XX XXX XXXX"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>

            {/* Student Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("student_email")}
              </label>
              <input
                type="email"
                value={formData.student_email}
                onChange={(e) =>
                  setFormData({ ...formData, student_email: e.target.value })
                }
                disabled={!isEditing}
                placeholder="student@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

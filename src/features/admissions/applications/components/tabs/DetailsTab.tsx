"use client";

import { useTranslations } from "next-intl";
import { FileText, User, MapPin, Heart, Calendar } from "lucide-react";
import { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import type { RegistrationStudentRequest } from "@/features/admissions/applications/api/registrationDtos";

interface DetailsTabProps {
  application: Application;
  studentDraft?: Partial<RegistrationStudentRequest> | null;
  gradeLabel?: string | null;
  academicYearLabel?: string | null;
  previousSchool?: string | null;
}

export default function DetailsTab({
  application,
  studentDraft,
  gradeLabel,
  academicYearLabel,
  previousSchool,
}: DetailsTabProps) {
  const t = useTranslations("admissions.application360");
  const studentContact = studentDraft?.contact;

  // Helper function to determine stage from grade
  const getStageFromGrade = (grade: string | undefined): string => {
    if (!grade) return "N/A";
    const gradeNum = parseInt(grade.replace(/\D/g, ""));
    if (gradeNum >= 1 && gradeNum <= 5) return "Primary";
    if (gradeNum >= 6 && gradeNum <= 9) return "Preparatory";
    if (gradeNum >= 10 && gradeNum <= 12) return "Secondary";
    return "N/A";
  };

  const displayStage =
    application.stage ??
    getStageFromGrade(
      gradeLabel || undefined,
    );
  const displayGrade = gradeLabel;

  return (
    <div className="space-y-6">
      {/* Student Personal Information - Name Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          {t("details.student_info")}
        </h3>
        <div className="space-y-6">
          {/* Arabic Name Components */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {t("details.arabic_name")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {studentDraft?.first_name_ar && (
                <div>
                  <p className="text-xs text-gray-500">First Name (AR)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.first_name_ar}
                  </p>
                </div>
              )}
              {studentDraft?.father_name_ar && (
                <div>
                  <p className="text-xs text-gray-500">Father Name (AR)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.father_name_ar}
                  </p>
                </div>
              )}
              {studentDraft?.grandfather_name_ar && (
                <div>
                  <p className="text-xs text-gray-500">Grandfather Name (AR)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.grandfather_name_ar}
                  </p>
                </div>
              )}
              {studentDraft?.family_name_ar && (
                <div>
                  <p className="text-xs text-gray-500">Family Name (AR)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.family_name_ar}
                  </p>
                </div>
              )}
            </div>
            {studentDraft?.full_name_ar && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Full Name (AR)</p>
                <p className="text-sm font-medium text-gray-900">
                  {studentDraft.full_name_ar}
                </p>
              </div>
            )}
          </div>

          {/* English Name Components */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {t("details.english_name")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {studentDraft?.first_name_en && (
                <div>
                  <p className="text-xs text-gray-500">First Name (EN)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.first_name_en}
                  </p>
                </div>
              )}
              {studentDraft?.father_name_en && (
                <div>
                  <p className="text-xs text-gray-500">Father Name (EN)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.father_name_en}
                  </p>
                </div>
              )}
              {studentDraft?.grandfather_name_en && (
                <div>
                  <p className="text-xs text-gray-500">Grandfather Name (EN)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.grandfather_name_en}
                  </p>
                </div>
              )}
              {studentDraft?.family_name_en && (
                <div>
                  <p className="text-xs text-gray-500">Family Name (EN)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {studentDraft.family_name_en}
                  </p>
                </div>
              )}
            </div>
            {(studentDraft?.full_name_en || studentDraft?.name || application.studentName) && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Full Name (EN)</p>
                <p className="text-sm font-medium text-gray-900">
                  {studentDraft?.full_name_en || studentDraft?.name || application.studentName}
                </p>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studentDraft?.gender && (
              <div>
                <p className="text-xs text-gray-500">{t("details.gender")}</p>
                <p className="text-sm font-medium text-gray-900">
                  {studentDraft.gender}
                </p>
              </div>
            )}
            {(studentDraft?.date_of_birth || studentDraft?.dateOfBirth) && (
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.date_of_birth")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(
                    studentDraft.date_of_birth || studentDraft.dateOfBirth || "",
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
            {studentDraft?.nationality && (
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.nationality")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {studentDraft.nationality}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t("details.academic_info")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {displayStage !== "N/A" && (
            <div>
              <p className="text-xs text-gray-500">{t("details.stage")}</p>
              <p className="text-sm font-medium text-gray-900">
                {displayStage}
              </p>
            </div>
          )}
          {displayGrade && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.grade_requested")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {displayGrade}
              </p>
            </div>
          )}
          {academicYearLabel && (
            <div>
              <p className="text-xs text-gray-500">Academic Year</p>
              <p className="text-sm font-medium text-gray-900">
                {academicYearLabel}
              </p>
            </div>
          )}
          {application.section && (
            <div>
              <p className="text-xs text-gray-500">{t("details.section")}</p>
              <p className="text-sm font-medium text-gray-900">
                {application.section}
              </p>
            </div>
          )}
          {previousSchool && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.previous_school")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {previousSchool}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t("details.contact_info")}
        </h3>
        <div className="space-y-3">
          {studentContact?.address_line && (
            <div>
              <p className="text-xs text-gray-500">{t("details.address")}</p>
              <p className="text-sm font-medium text-gray-900">
                {studentContact.address_line}
              </p>
              {(studentContact.district || studentContact.city) && (
                <p className="text-xs text-gray-600">
                  {[studentContact.district, studentContact.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentContact?.student_phone && (
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.student_phone")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {studentContact.student_phone}
                </p>
              </div>
            )}
            {studentContact?.student_email && (
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.student_email")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {studentContact.student_email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medical & Notes */}
      {(application.medical_conditions || application.notes) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            {t("details.medical_additional")}
          </h3>
          <div className="space-y-3">
            {application.medical_conditions && (
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.medical_conditions")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {application.medical_conditions}
                </p>
              </div>
            )}
            {application.notes && (
              <div>
                <p className="text-xs text-gray-500">{t("details.notes")}</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Dates & Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t("details.important_dates")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {application.submittedDate && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.submitted_date")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(application.submittedDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {application.join_date && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.expected_start_date")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(application.join_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {application.status && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.application_status")}
              </p>
              <StatusBadge status={application.status} size="md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

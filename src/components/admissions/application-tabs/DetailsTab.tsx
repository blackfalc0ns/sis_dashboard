"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Heart,
  Calendar,
} from "lucide-react";
import { Application } from "@/types/admissions";
import StatusBadge from "../shared/StatusBadge";

interface DetailsTabProps {
  application: Application;
}

export default function DetailsTab({ application }: DetailsTabProps) {
  const t = useTranslations("admissions.application360");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t("details.student_info")}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">
                {t("details.english_name")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.full_name_en || application.studentName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {t("details.arabic_name")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.full_name_ar ||
                  application.studentNameArabic ||
                  "N/A"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">{t("details.gender")}</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.gender || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {t("details.date_of_birth")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {application.date_of_birth
                    ? new Date(application.date_of_birth).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {t("details.nationality")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.nationality || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {t("details.grade_requested")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.grade_requested || application.gradeRequested}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t("details.contact_info")}
          </h3>
          <div className="space-y-3">
            {application.address_line && (
              <div>
                <p className="text-xs text-gray-500">{t("details.address")}</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.address_line}
                </p>
                {(application.district || application.city) && (
                  <p className="text-xs text-gray-600">
                    {[application.district, application.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
            {application.student_phone && (
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {t("details.student_phone")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {application.student_phone}
                </p>
              </div>
            )}
            {application.student_email && (
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {t("details.student_email")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {application.student_email}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {application.previous_school && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.previous_school")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.previous_school}
              </p>
            </div>
          )}
          {application.join_date && (
            <div>
              <p className="text-xs text-gray-500">
                {t("details.intended_join_date")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(application.join_date).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">
              {t("details.application_status")}
            </p>
            <StatusBadge status={application.status} size="md" />
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

      {/* Application Dates */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t("details.important_dates")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">
              {t("details.submitted_date")}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(application.submittedDate).toLocaleDateString()}
            </p>
          </div>
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
        </div>
      </div>
    </div>
  );
}

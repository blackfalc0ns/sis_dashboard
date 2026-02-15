// FILE: src/components/students-guardians/profile-tabs/GuardiansTab.tsx

"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Phone,
  Mail,
  Star,
  Edit2,
  Trash2,
  Users,
  Briefcase,
  Building2,
  IdCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Student } from "@/types/students";
import * as studentsService from "@/services/studentsService";
import AddGuardianModal, {
  GuardianFormData,
} from "@/components/students-guardians/modals/AddGuardianModal";
import { useTranslations } from "next-intl";

interface GuardiansTabProps {
  student: Student;
}

export default function GuardiansTab({ student }: GuardiansTabProps) {
  const t = useTranslations("students_guardians.profile.guardians");
  // Load guardians from service
  const guardians = useMemo(
    () => studentsService.getStudentGuardians(student.id),
    [student.id],
  );

  const primaryGuardian = useMemo(
    () => studentsService.getPrimaryGuardian(student.id),
    [student.id],
  );

  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddGuardian = (guardianData: GuardianFormData) => {
    // TODO: Implement API call to add guardian
    console.log("Adding guardian:", guardianData);

    // Close modal
    setShowAddModal(false);

    // Show success message (you can add a toast notification here)
    alert("Guardian added successfully!");
  };

  const getRelationBadge = (relation: string) => {
    const colors: Record<string, string> = {
      father: "bg-blue-100 text-blue-700",
      mother: "bg-pink-100 text-pink-700",
      guardian: "bg-purple-100 text-purple-700",
      other: "bg-gray-100 text-gray-700",
    };

    const relationLower = relation.toLowerCase();

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[relationLower] || colors.other}`}
      >
        {relation.charAt(0).toUpperCase() + relation.slice(1)}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone || "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {guardians.length === 1
              ? t("registered_count", { count: guardians.length })
              : t("registered_count_plural", { count: guardians.length })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("add_guardian")}
        </button>
      </div>

      {/* Summary Cards */}
      {primaryGuardian && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("primary_guardian")}
              </p>
              <p className="text-sm text-gray-600">
                {primaryGuardian.full_name} ({primaryGuardian.relation})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guardians List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {guardians.map((guardian) => (
          <div
            key={guardian.guardianId}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#036b80] transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white font-bold shrink-0">
                  {getInitials(guardian.full_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {guardian.full_name}
                    </h3>
                    {guardian.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {getRelationBadge(guardian.relation)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Guardian"
                  onClick={() => {
                    // Handle edit
                    console.log("Edit guardian:", guardian.guardianId);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!guardian.is_primary && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Guardian"
                    onClick={() => {
                      // Handle remove
                      console.log("Remove guardian:", guardian.guardianId);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 font-medium">
                    {formatPhoneNumber(guardian.phone_primary)}
                  </p>
                  {guardian.phone_secondary && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      {t("alt")}: {formatPhoneNumber(guardian.phone_secondary)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 truncate">{guardian.email}</span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <IdCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs">{t("national_id")}</p>
                  <p className="text-gray-700 font-mono text-xs">
                    {guardian.national_id}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700">{guardian.job_title}</p>
                  {guardian.workplace && (
                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {guardian.workplace}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {t("permissions")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                    guardian.can_pickup
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {guardian.can_pickup ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{t("can_pickup")}</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                    guardian.can_receive_notifications
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {guardian.can_receive_notifications ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{t("notifications")}</span>
                </div>
              </div>
            </div>

            {/* Primary Guardian Badge */}
            {guardian.is_primary && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {t("primary_guardian")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {guardians.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("no_guardians")}
          </h3>
          <p className="text-gray-500 mb-4">{t("no_guardians_message")}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("add_guardian")}
          </button>
        </div>
      )}

      {/* Statistics */}
      {guardians.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {t("guardian_summary")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#036b80]">
                {guardians.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("total_guardians")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {guardians.filter((g) => g.can_pickup).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("can_pickup")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {guardians.filter((g) => g.can_receive_notifications).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("get_notifications")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {guardians.filter((g) => g.is_primary).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("primary")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Guardian Modal */}
      <AddGuardianModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGuardian}
        studentId={student.id}
      />
    </div>
  );
}

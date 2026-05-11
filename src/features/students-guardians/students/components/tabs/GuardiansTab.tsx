// FILE: src/components/students-guardians/profile-tabs/GuardiansTab.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Phone,
  Mail,
  Star,
  Edit2,
  Trash2,
  Search,
  Users,
  Briefcase,
  Building2,
  IdCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Student, type StudentGuardian } from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import AddGuardianModal, {
  GuardianFormData,
} from "@/features/students-guardians/students/components/modals/AddGuardianModal";
import { useTranslations } from "next-intl";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface GuardiansTabProps {
  student: Student;
}

export default function GuardiansTab({ student }: GuardiansTabProps) {
  const t = useTranslations("students_guardians.profile.guardians");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [guardianSearchResults, setGuardianSearchResults] = useState<
    StudentGuardian[]
  >([]);
  const [isSearchingGuardians, setIsSearchingGuardians] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState("");
  const [linkAsPrimary, setLinkAsPrimary] = useState(false);
  const [primaryGuardian, setPrimaryGuardian] =
    useState<StudentGuardian | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [guardiansData, primaryGuardianData] = await Promise.all([
          studentsService.fetchStudentGuardians(student.id),
          studentsService.fetchPrimaryGuardian(student.id),
        ]);

        if (isCancelled) {
          return;
        }

        setGuardians(guardiansData);
        setPrimaryGuardian(primaryGuardianData);
      } catch (loadError) {
        if (!isCancelled) {
          setGuardians([]);
          setPrimaryGuardian(undefined);
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load guardians.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [student.id]);

  const handleAddGuardian = async (guardianData: GuardianFormData) => {
    setError(null);
    try {
      const guardian = await studentsService.createGuardian(guardianData);
      await studentsService.linkGuardianToStudent(student.id, {
        guardianId: guardian.guardianId,
        is_primary: guardianData.is_primary,
      });
      const [guardiansData, primaryGuardianData] = await Promise.all([
        studentsService.fetchStudentGuardians(student.id),
        studentsService.fetchPrimaryGuardian(student.id),
      ]);
      setGuardians(guardiansData);
      setPrimaryGuardian(primaryGuardianData);
      setShowAddModal(false);
    } catch (submitError) {
      throw submitError;
    }
  };

  useEffect(() => {
    if (!showLinkModal) {
      return;
    }

    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsSearchingGuardians(true);
      setError(null);

      try {
        const results = await studentsService.fetchAllGuardians({
          search: guardianSearch,
        });
        const linkedIds = new Set(guardians.map((guardian) => guardian.guardianId));
        if (!isCancelled) {
          setGuardianSearchResults(
            results.filter((guardian) => !linkedIds.has(guardian.guardianId)),
          );
        }
      } catch (searchError) {
        if (!isCancelled) {
          setGuardianSearchResults([]);
          setError(
            searchError instanceof Error
              ? searchError.message
              : "Unable to search guardians.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingGuardians(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardianSearch, guardians, showLinkModal]);

  const refreshStudentGuardians = async () => {
    const [guardiansData, primaryGuardianData] = await Promise.all([
      studentsService.fetchStudentGuardians(student.id),
      studentsService.fetchPrimaryGuardian(student.id),
    ]);
    setGuardians(guardiansData);
    setPrimaryGuardian(primaryGuardianData);
  };

  const handleLinkExistingGuardian = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGuardianId) {
      setError("Please select a guardian to link.");
      return;
    }

    try {
      setError(null);
      await studentsService.linkGuardianToStudent(student.id, {
        guardianId: selectedGuardianId,
        is_primary: linkAsPrimary,
      });
      await refreshStudentGuardians();
      setShowLinkModal(false);
      setSelectedGuardianId("");
      setGuardianSearch("");
      setLinkAsPrimary(false);
    } catch (linkError) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Unable to link guardian.",
      );
    }
  };

  const handleUnlinkGuardian = async (guardianId: string) => {
    try {
      setError(null);
      await studentsService.unlinkGuardianFromStudent(student.id, guardianId);
      await refreshStudentGuardians();
    } catch (unlinkError) {
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Unable to unlink guardian.",
      );
    }
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
      {isLoading ? <PartialLoader /> : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Link existing
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("add_guardian")}
          </button>
        </div>
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
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-hover flex items-center justify-center text-white font-bold shrink-0">
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
                  className="p-2 text-gray-400 rounded-lg cursor-not-allowed"
                  title="Editing guardian links is not available yet"
                  disabled
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!guardian.is_primary && (
                  <button
                    onClick={() => void handleUnlinkGuardian(guardian.guardianId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Unlink guardian from student"
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
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
              <p className="text-2xl font-bold text-primary">
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
      />

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleLinkExistingGuardian}
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Link existing guardian
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Search guardians
              <input
                value={guardianSearch}
                onChange={(event) => setGuardianSearch(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                placeholder="Search by name, phone, or email"
              />
            </label>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {isSearchingGuardians ? (
                <p className="text-sm text-gray-500">Searching...</p>
              ) : guardianSearchResults.length === 0 ? (
                <p className="text-sm text-gray-500">No guardians found.</p>
              ) : (
                guardianSearchResults.map((guardian) => (
                  <label
                    key={guardian.guardianId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:border-primary"
                  >
                    <input
                      type="radio"
                      name="guardianId"
                      value={guardian.guardianId}
                      checked={selectedGuardianId === guardian.guardianId}
                      onChange={() => setSelectedGuardianId(guardian.guardianId)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {guardian.full_name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {guardian.relation} - {guardian.phone_primary}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={linkAsPrimary}
                onChange={(event) => setLinkAsPrimary(event.target.checked)}
              />
              Mark as primary guardian
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedGuardianId}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-hover disabled:opacity-60"
              >
                Link guardian
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

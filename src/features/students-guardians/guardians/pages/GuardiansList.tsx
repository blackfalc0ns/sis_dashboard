// FILE: src/components/students-guardians/GuardiansList.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  Search,
  X,
  Eye,
  Edit,
  Download,
  Star,
  CheckCircle,
  XCircle,
  Lock,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { StudentGuardian } from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import ChangePasswordModal from "@/features/students-guardians/students/components/modals/ChangePasswordModal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatGuardiansForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function GuardiansList() {
  const t = useTranslations("students_guardians.guardians_list");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const {
    yearId,
    termId,
    isLoading: isContextLoading,
    error: contextError,
  } =
    useStudentsGuardiansYearTermContext();

  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [scopedGuardianIds, setScopedGuardianIds] = useState<Set<string>>(
    new Set(),
  );
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (isContextLoading) {
      return () => {
        isCancelled = true;
      };
    }

    if (!yearId || !termId) {
      setGuardians([]);
      setScopedGuardianIds(new Set());
      setPageError(null);
      setIsPageLoading(false);

      return () => {
        isCancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsPageLoading(true);
      setPageError(null);

      try {
        const [guardiansData, studentsInContext] = await Promise.all([
          studentsService.fetchAllGuardians(),
          studentsService.fetchStudentsWithEnrollmentForContext(yearId, termId),
        ]);
        const guardianStudentGroups = await Promise.all(
          guardiansData.map(async (guardian) => ({
            guardianId: guardian.guardianId,
            students: await studentsService.fetchGuardianStudents(
              guardian.guardianId,
            ),
          })),
        );

        if (isCancelled) {
          return;
        }

        setGuardians(guardiansData);
        const scopedIds = new Set(studentsInContext.map((student) => student.id));
        const guardianIdsInScope = new Set(
          guardianStudentGroups
            .filter((group) =>
              group.students.some((student) => scopedIds.has(student.id)),
            )
            .map((group) => group.guardianId),
        );
        setScopedGuardianIds(guardianIdsInScope);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setGuardians([]);
        setScopedGuardianIds(new Set());
        setPageError(
          error instanceof Error ? error.message : t("loading_error"),
        );
      } finally {
        if (!isCancelled) {
          setIsPageLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isContextLoading, termId, t, yearId]);

  const guardiansInContext = useMemo(
    () => guardians.filter((guardian) => scopedGuardianIds.has(guardian.guardianId)),
    [guardians, scopedGuardianIds],
  );

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [passwordChangeGuardian, setPasswordChangeGuardian] =
    useState<StudentGuardian | null>(null);
  const { values, setValue, replaceValues, reset } = useUrlQueryState<{
    search: string;
    relation: string;
  }>({
    defaults: {
      search: "",
      relation: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = values.search;
  const relationFilter = values.relation;

  // Filter guardians
  const filteredGuardians = useMemo(() => {
    return guardiansInContext.filter((guardian) => {
      const matchesSearch =
        searchQuery === "" ||
        guardian.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guardian.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guardian.phone_primary.includes(searchQuery) ||
        guardian.national_id.includes(searchQuery);

      const matchesRelation =
        relationFilter === "all" || guardian.relation === relationFilter;

      return matchesSearch && matchesRelation;
    });
  }, [guardiansInContext, searchQuery, relationFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = guardiansInContext.length;
    const primary = guardiansInContext.filter((g) => g.is_primary).length;
    const canPickup = guardiansInContext.filter((g) => g.can_pickup).length;
    const receiveNotifications = guardiansInContext.filter(
      (g) => g.can_receive_notifications,
    ).length;

    return { total, primary, canPickup, receiveNotifications };
  }, [guardiansInContext]);

  // Get unique relations
  const uniqueRelations = useMemo(() => {
    const relations = new Set<string>();
    guardiansInContext.forEach((g) => relations.add(g.relation));
    return Array.from(relations).sort();
  }, [guardiansInContext]);

  useEffect(() => {
    if (relationFilter !== "all" && !uniqueRelations.includes(relationFilter)) {
      replaceValues({ relation: null });
    }
  }, [relationFilter, replaceValues, uniqueRelations]);

  const hasActiveFilters = searchQuery !== "" || relationFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
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

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatGuardiansForExport(filteredGuardians, exportLocale),
      format,
      filenameBase: "guardians",
      emptyMessage: t("no_guardians_message"),
    });
  };

  const handleChangePasswordClick = (
    e: React.MouseEvent,
    guardian: StudentGuardian,
  ) => {
    e.stopPropagation();
    setPasswordChangeGuardian(guardian);
    setShowChangePasswordModal(true);
  };

  const handlePasswordChange = (data: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    // TODO: Implement API call to change password
    console.log(
      "Changing password for guardian:",
      passwordChangeGuardian?.guardianId,
    );
    console.log("New password:", data.newPassword);

    // Show success message
    alert(t("change_password.success"));
  };

  const handleRowClick = (guardian: StudentGuardian) => {
    router.push(`/${lang}/students-guardians/guardians/${guardian.guardianId}`);
  };

  const columns = [
    {
      key: "guardianId",
      label: t("columns.guardian_id"),
      searchable: true,
    },
    {
      key: "full_name",
      label: t("columns.name"),
      searchable: true,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{_ as string}</span>
          {(row as unknown as StudentGuardian).is_primary && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: "relation",
      label: t("columns.relation"),
      render: (value: unknown) => getRelationBadge(value as string),
    },
    {
      key: "phone_primary",
      label: t("columns.phone"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value as string}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: t("columns.email"),
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="text-sm truncate max-w-[200px]">
            {value as string}
          </span>
        </div>
      ),
    },
    {
      key: "can_pickup",
      label: t("columns.can_pickup"),
      render: (value: unknown) =>
        value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        ),
    },
    {
      key: "can_receive_notifications",
      label: t("columns.notifications"),
      render: (value: unknown) =>
        value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        ),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      sortable: false,
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: View guardian details
              console.log("View guardian:", row);
            }}
            className="p-1.5 text-primary hover:bg-primary hover:text-white rounded transition-colors"
            title={t("actions.view_details")}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Edit guardian
              console.log("Edit guardian:", row);
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={t("actions.edit")}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) =>
              handleChangePasswordClick(e, row as unknown as StudentGuardian)
            }
            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title={t("actions.change_password")}
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isContextLoading || isPageLoading) {
    return <MainLoader />;
  }

  if (contextError || pageError || !yearId || !termId) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-sm text-red-600">
            {contextError || pageError || t("loading_error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("kpis.total_guardians")}
          value={kpis.total}
          subtitle={t("kpis.shown", { count: filteredGuardians.length })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.total - 15) },
            { label: "M2", value: Math.max(0, kpis.total - 10) },
            { label: "M3", value: Math.max(0, kpis.total - 5) },
            { label: "M4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("kpis.primary_guardians")}
          value={kpis.primary}
          subtitle={t("kpis.main_contacts")}
          icon={Star}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.primary - 8) },
            { label: "M2", value: Math.max(0, kpis.primary - 5) },
            { label: "M3", value: Math.max(0, kpis.primary - 3) },
            { label: "M4", value: kpis.primary },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("kpis.can_pickup")}
          value={kpis.canPickup}
          subtitle={t("kpis.authorized")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.canPickup - 10) },
            { label: "M2", value: Math.max(0, kpis.canPickup - 7) },
            { label: "M3", value: Math.max(0, kpis.canPickup - 4) },
            { label: "M4", value: kpis.canPickup },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpis.receive_notifications")}
          value={kpis.receiveNotifications}
          subtitle={t("kpis.subscribed")}
          icon={Mail}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "M1", value: Math.max(0, kpis.receiveNotifications - 12) },
            { label: "M2", value: Math.max(0, kpis.receiveNotifications - 8) },
            { label: "M3", value: Math.max(0, kpis.receiveNotifications - 4) },
            { label: "M4", value: kpis.receiveNotifications },
          ]}
          chartColor="#8b5cf6"
        />
      </div>

      {/* Filters and Actions */}
      <FilterPanel
        searchSlot={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 placeholder:text-black/60 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("export")}
              </button>
            </div>
          </div>
        }
        filtersSlot={
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("relation")}
                </label>
                <select
                  value={relationFilter}
                  onChange={(e) => {
                    setValue("relation", e.target.value, "push");
                  }}
                  className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">{t("all_relations")}</option>
                  {uniqueRelations.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation.charAt(0).toUpperCase() + relation.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {t("active_filters")}
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
            >
              <X className="w-3 h-3" />
              {t("clear_all")}
            </button>
          </div>
        }
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
      />

      {/* Guardians Table */}
      {filteredGuardians.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("no_guardians")}
          </h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters ? t("try_adjusting") : t("no_guardians_message")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredGuardians as unknown as Record<string, unknown>[]}
          showPagination={true}
          itemsPerPage={20}
          searchQuery={searchQuery}
          onRowClick={(row) =>
            handleRowClick(row as unknown as StudentGuardian)
          }
          urlState={{
            keyPrefix: "guardiansTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Change Password Modal */}
      {passwordChangeGuardian && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => {
            setShowChangePasswordModal(false);
            setPasswordChangeGuardian(null);
          }}
          onSubmit={handlePasswordChange}
          userName={passwordChangeGuardian.full_name}
          userType="guardian"
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
        datasetCount={filteredGuardians.length}
        emptyStateMessage={t("no_guardians_message")}
      />
    </div>
  );
}

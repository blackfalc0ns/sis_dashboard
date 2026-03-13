"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, Edit2, Trash2, Power, PowerOff, Filter, Bell, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { Tooltip } from "@mui/material";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DataTable from "@/components/ui/data-table/DataTable";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { isPolicyConfigComplete, hasNotificationsEnabled } from "../utils/policyKpis";
import { getPeriodDisplayLabel } from "../../utils/periodIdNormalization";
import type { AttendancePolicy, AttendanceScopeType } from "../types";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";

interface PoliciesListPanelProps {
  policies: AttendancePolicy[];
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  onCreatePolicy: () => void;
  onEditPolicy: (policy: AttendancePolicy) => void;
  onDeletePolicy: (policyId: string) => Promise<void>;
  onToggleActive: (policyId: string, isActive: boolean) => Promise<void>;
}

export default function PoliciesListPanel({
  policies,
  stages,
  grades,
  sections,
  classrooms,
  isReadOnly,
  onCreatePolicy,
  onEditPolicy,
  onDeletePolicy,
  onToggleActive,
}: PoliciesListPanelProps) {
  const t = useTranslations("attendance.policies");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | AttendanceScopeType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<AttendancePolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get scope display name
  const getScopeName = useCallback((policy: AttendancePolicy): string => {
    return getAttendanceScopeLabel({
      scopeType: policy.scopeType,
      scopeIds: policy.scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
    });
  }, [classrooms, grades, locale, sections, stages]);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch =
          policy.nameAr.toLowerCase().includes(query) ||
          policy.nameEn.toLowerCase().includes(query);
        const scopeMatch = getScopeName(policy).toLowerCase().includes(query);
        if (!nameMatch && !scopeMatch) return false;
      }

      // Scope filter
      if (scopeFilter !== "ALL" && policy.scopeType !== scopeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !policy.isActive) return false;
      if (statusFilter === "INACTIVE" && policy.isActive) return false;

      // Notifications filter
      if (notificationsFilter !== "ALL") {
        const hasNotif = hasNotificationsEnabled(policy);
        if (notificationsFilter === "ENABLED" && !hasNotif) return false;
        if (notificationsFilter === "DISABLED" && hasNotif) return false;
      }

      return true;
    });
  }, [policies, searchQuery, scopeFilter, statusFilter, notificationsFilter, getScopeName]);

  const handleDeleteClick = (policy: AttendancePolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;

    setIsDeleting(true);
    try {
      await onDeletePolicy(policyToDelete.id);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    } catch (error) {
      console.error("Failed to delete policy:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (policy: AttendancePolicy) => {
    try {
      await onToggleActive(policy.id, !policy.isActive);
    } catch (error) {
      console.error("Failed to toggle policy status:", error);
    }
  };

  const columns = [
    {
      key: "name",
      label: t("policyName"),
      searchable: true,
      render: (_: unknown, row: AttendancePolicy) => {
        const isIncomplete = !isPolicyConfigComplete(row);
        return (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {locale === "ar" ? row.nameAr : row.nameEn}
              </div>
              <div className="text-xs text-gray-500">
                {locale === "ar" ? row.nameEn : row.nameAr}
              </div>
            </div>
            {isIncomplete && (
              <Tooltip title={t("list.incompleteConfigWarning")} arrow>
                <AlertTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "scope",
      label: t("scope"),
      render: (_: unknown, row: AttendancePolicy) => (
        <div>
          <div className="text-sm text-gray-900">{getScopeName(row)}</div>
          <div className="text-xs text-gray-500">
            {t(`scopeType.${row.scopeType.toLowerCase()}`)}
          </div>
        </div>
      ),
    },
    {
      key: "tracking",
      label: t("list.tracking"),
      render: (_: unknown, row: AttendancePolicy) => {
        const selectedCount = row.selectedPeriodIds?.length || 0;
        const threshold = row.absentIfMissedPeriodsCount || 0;
        
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded w-fit bg-purple-100 text-purple-800">
              {t("form.period")}
            </span>
            {selectedCount > 0 && threshold > 0 && (
              <Tooltip 
                title={locale === "ar" 
                  ? `غائب إذا فات ${threshold} من ${selectedCount} حصص` 
                  : `Absent if missed ${threshold} of ${selectedCount} periods`
                } 
                arrow
              >
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded w-fit bg-teal-100 text-teal-800 cursor-help">
                  {locale === "ar" 
                    ? `${threshold}/${selectedCount} حصص` 
                    : `${threshold}/${selectedCount} periods`
                  }
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "periods",
      label: t("list.periods"),
      render: (_: unknown, row: AttendancePolicy) => {
        const periodCount = row.selectedPeriodIds?.length || 0;
        
        if (periodCount === 0) {
          return (
            <Tooltip title={t("list.noPeriodsSelected")} arrow>
              <span className="text-orange-600 text-sm font-medium">
                {t("list.none")}
              </span>
            </Tooltip>
          );
        }

        const periodLabels = row.selectedPeriodIds?.map((id) => getPeriodDisplayLabel(id));

        return (
          <Tooltip title={periodLabels?.join(", ") || ""} arrow>
            <span className="text-sm text-gray-700 cursor-help">
              {periodCount} {t("list.periodsCount")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      key: "notifications",
      label: t("list.notifications"),
      render: (_: unknown, row: AttendancePolicy) => {
        const hasNotif = hasNotificationsEnabled(row);

        if (!hasNotif) {
          return <span className="text-gray-400 text-sm">—</span>;
        }

        const recipients = [];
        if (row.notifyTeachers) recipients.push(t("list.teachers"));
        if (row.notifyStudents) recipients.push(t("list.students"));
        if (row.notifyGuardians) recipients.push(t("list.guardians"));

        const triggers = [];
        if (row.notifyOnAbsent) triggers.push(t("list.absent"));
        if (row.notifyOnLate) triggers.push(t("list.late"));
        if (row.notifyOnEarlyLeave) triggers.push(t("list.earlyLeave"));

        const summary = `${recipients.join(" + ")} / ${triggers.join(" + ")}`;

        return (
          <Tooltip title={summary} arrow>
            <div className="flex items-center gap-1 text-sm text-purple-700 cursor-help flex-0 w-fit">
              <Bell className="w-3.5 h-3.5" />
              <span>{recipients.length + triggers.length}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "rules",
      label: t("list.rules"),
      render: (_: unknown, row: AttendancePolicy) => {
        const rulesSummary = [];
        rulesSummary.push(`${t("list.late")}: ${row.lateThresholdMinutes}${t("list.min")}`);
        rulesSummary.push(`${t("list.early")}: ${row.earlyLeaveThresholdMinutes}${t("list.min")}`);
        if (row.autoAbsentAfterMinutes) {
          rulesSummary.push(`${t("list.autoAbsent")}: ${row.autoAbsentAfterMinutes}${t("list.min")}`);
        }
        if (row.absentIfMissedPeriodsCount) {
          rulesSummary.push(`${t("list.missedPeriods")}: ${row.absentIfMissedPeriodsCount}`);
        }

        return (
          <Tooltip title={rulesSummary.join(" • ")} arrow>
            <span className="text-sm text-gray-600 cursor-help">
              {row.lateThresholdMinutes}/{row.earlyLeaveThresholdMinutes}
            </span>
          </Tooltip>
        );
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: AttendancePolicy) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: AttendancePolicy) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditPolicy(row);
            }}
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title={t("edit")}
            disabled={isReadOnly}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row);
            }}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
            }`}
            title={row.isActive ? t("deactivate") : t("activate")}
            disabled={isReadOnly}
          >
            {row.isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title={t("delete")}
            disabled={isReadOnly}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("policiesList")}
          </h2>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onCreatePolicy}
            disabled={isReadOnly}
          >
            {t("createPolicy")}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar with Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
              title={showFilters ? "Hide filters" : "Show filters"}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Dropdowns (Collapsible) */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select
                value={scopeFilter}
                onChange={(value) => setScopeFilter(value as "ALL" | AttendanceScopeType)}
                options={[
                  { value: "ALL", label: tCommon("all_scopes") },
                  { value: "SCHOOL", label: t("scopeType.school") },
                  { value: "STAGE", label: t("scopeType.stage") },
                  { value: "GRADE", label: t("scopeType.grade") },
                  { value: "SECTION", label: t("scopeType.section") },
                  { value: "CLASSROOM", label: t("scopeType.classroom") },
                ]}
                selectSize="sm"
              />

              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")}
                options={[
                  { value: "ALL", label: tCommon("all_statuses") },
                  { value: "ACTIVE", label: t("active") },
                  { value: "INACTIVE", label: t("inactive") },
                ]}
                selectSize="sm"
              />

              <Select
                value={notificationsFilter}
                onChange={(value) => setNotificationsFilter(value as "ALL" | "ENABLED" | "DISABLED")}
                options={[
                  { value: "ALL", label: tCommon("all") },
                  { value: "ENABLED", label: t("list.notifications") },
                  { value: "DISABLED", label: t("inactive") },
                ]}
                selectSize="sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
          data={filteredPolicies as unknown as { [key: string]: unknown }[]}
          onRowClick={(row) => onEditPolicy(row as unknown as AttendancePolicy)}
          searchQuery={searchQuery}
          itemsPerPage={10}
          showPagination={true}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPolicyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc", {
          name: policyToDelete
            ? locale === "ar"
              ? policyToDelete.nameAr
              : policyToDelete.nameEn
            : "",
        })}
        confirmLabel={t("delete")}
        cancelLabel={tCommon("cancel")}
        loading={isDeleting}
        severity="danger"
      />
    </div>
  );
}




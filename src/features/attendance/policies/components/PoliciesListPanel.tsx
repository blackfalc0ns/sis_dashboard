"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, Edit2, Trash2, Power, PowerOff } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DataTable from "@/components/ui/data-table/DataTable";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import type { AttendancePolicy, AttendanceScopeType } from "../types";
import type { Stage, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";

interface PoliciesListPanelProps {
  policies: AttendancePolicy[];
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
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
  const [modeFilter, setModeFilter] = useState<"ALL" | "DAILY" | "PERIOD">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<AttendancePolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get scope display name
  const getScopeName = (policy: AttendancePolicy): string => {
    if (policy.scopeType === "SCHOOL") {
      return locale === "ar" ? "المدرسة" : "School";
    }

    if (policy.scopeType === "STAGE" && policy.scopeIds?.stageId) {
      const stage = stages.find((s) => s.id === policy.scopeIds?.stageId);
      return locale === "ar" ? stage?.nameAr || "" : stage?.nameEn || "";
    }

    if (policy.scopeType === "GRADE" && policy.scopeIds?.gradeId) {
      const grade = grades.find((g) => g.id === policy.scopeIds?.gradeId);
      return locale === "ar" ? grade?.nameAr || "" : grade?.nameEn || "";
    }

    if (policy.scopeType === "SECTION" && policy.scopeIds?.sectionId) {
      const section = sections.find((s) => s.id === policy.scopeIds?.sectionId);
      return locale === "ar" ? section?.nameAr || "" : section?.nameEn || "";
    }

    return "";
  };

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

      // Mode filter
      if (modeFilter !== "ALL" && policy.mode !== modeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !policy.isActive) return false;
      if (statusFilter === "INACTIVE" && policy.isActive) return false;

      return true;
    });
  }, [policies, searchQuery, scopeFilter, modeFilter, statusFilter, stages, grades, sections]);

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
      render: (_: unknown, row: AttendancePolicy) => (
        <div>
          <div className="font-medium text-gray-900">
            {locale === "ar" ? row.nameAr : row.nameEn}
          </div>
          <div className="text-xs text-gray-500">
            {locale === "ar" ? row.nameEn : row.nameAr}
          </div>
        </div>
      ),
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
      key: "mode",
      label: t("mode"),
      render: (_: unknown, row: AttendancePolicy) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            row.mode === "DAILY"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {t(`form.${row.mode.toLowerCase()}`)}
        </span>
      ),
    },
    {
      key: "effectiveDates",
      label: t("effectivePeriod"),
      render: (_: unknown, row: AttendancePolicy) => (
        <div className="text-sm text-gray-700">
          {row.effectiveStartDate} → {row.effectiveEndDate}
        </div>
      ),
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={scopeFilter}
            onChange={(value) => setScopeFilter(value as "ALL" | AttendanceScopeType)}
            options={[
              { value: "ALL", label: tCommon("all_scopes") },
              { value: "SCHOOL", label: t("scopeType.school") },
              { value: "STAGE", label: t("scopeType.stage") },
              { value: "GRADE", label: t("scopeType.grade") },
              { value: "SECTION", label: t("scopeType.section") },
            ]}
            selectSize="sm"
          />

          <Select
            value={modeFilter}
            onChange={(value) => setModeFilter(value as "ALL" | "DAILY" | "PERIOD")}
            options={[
              { value: "ALL", label: tCommon("all_modes") },
              { value: "DAILY", label: t("form.daily") },
              { value: "PERIOD", label: t("form.period") },
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

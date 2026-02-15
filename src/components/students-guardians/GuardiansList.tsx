// FILE: src/components/students-guardians/GuardiansList.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Phone,
  Mail,
  Search,
  Filter,
  X,
  Eye,
  Edit,
  Download,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DataTable from "@/components/ui/common/DataTable";
import KPICard from "@/components/ui/common/KPICard";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { StudentGuardian } from "@/types/students";
import * as studentsService from "@/services/studentsService";

export default function GuardiansList() {
  const t = useTranslations("students_guardians.guardians_list");
  // Load guardians from service
  const [guardians] = useState<StudentGuardian[]>(
    studentsService.getAllGuardians(),
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [relationFilter, setRelationFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter guardians
  const filteredGuardians = useMemo(() => {
    return guardians.filter((guardian) => {
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
  }, [guardians, searchQuery, relationFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = guardians.length;
    const primary = guardians.filter((g) => g.is_primary).length;
    const canPickup = guardians.filter((g) => g.can_pickup).length;
    const receiveNotifications = guardians.filter(
      (g) => g.can_receive_notifications,
    ).length;

    return { total, primary, canPickup, receiveNotifications };
  }, [guardians]);

  // Get unique relations
  const uniqueRelations = useMemo(() => {
    const relations = new Set<string>();
    guardians.forEach((g) => relations.add(g.relation));
    return Array.from(relations).sort();
  }, [guardians]);

  const hasActiveFilters = searchQuery !== "" || relationFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setRelationFilter("all");
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

  const handleExport = () => {
    const exportData = filteredGuardians.map((guardian) => ({
      "Guardian ID": guardian.guardianId,
      "Full Name": guardian.full_name,
      Relation: guardian.relation,
      "National ID": guardian.national_id,
      "Primary Phone": guardian.phone_primary,
      "Secondary Phone": guardian.phone_secondary || "N/A",
      Email: guardian.email,
      "Job Title": guardian.job_title || "N/A",
      Workplace: guardian.workplace || "N/A",
      "Primary Guardian": guardian.is_primary ? "Yes" : "No",
      "Can Pickup": guardian.can_pickup ? "Yes" : "No",
      "Receive Notifications": guardian.can_receive_notifications
        ? "Yes"
        : "No",
    }));

    downloadCSV(exportData, generateFilename("guardians", "csv"));
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
            className="p-1.5 text-[#036b80] hover:bg-[#036b80] hover:text-white rounded transition-colors"
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
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("kpis.total_guardians")}
          value={kpis.total}
          icon={Users}
          numbers={t("kpis.shown", { count: filteredGuardians.length })}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("kpis.primary_guardians")}
          value={kpis.primary}
          icon={Star}
          numbers={t("kpis.main_contacts")}
          iconBgColor="bg-yellow-500"
        />
        <KPICard
          title={t("kpis.can_pickup")}
          value={kpis.canPickup}
          icon={CheckCircle}
          numbers={t("kpis.authorized")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("kpis.receive_notifications")}
          value={kpis.receiveNotifications}
          icon={Mail}
          numbers={t("kpis.subscribed")}
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? "bg-[#036b80] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              {t("filters")}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("export")}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("relation")}
                </label>
                <select
                  value={relationFilter}
                  onChange={(e) => setRelationFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
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
            )}
          </div>
        )}
      </div>

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
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
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
        />
      )}
    </div>
  );
}

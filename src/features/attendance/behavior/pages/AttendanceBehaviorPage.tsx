"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import Button from "@/components/ui/button/Button";
import DataTable from "@/components/ui/data-table/DataTable";
import { useToast } from "@/components/ui/toast/Toast";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceExportFormat } from "@/features/attendance/shared/utils/attendanceExport";
import BehaviorFiltersBar from "../components/BehaviorFiltersBar";
import BehaviorTable, { type BehaviorTableAction } from "../components/BehaviorTable";
import BehaviorDetailDrawer from "../components/BehaviorDetailDrawer";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "../components/BehaviorActionModals";
import {
  listBehaviorCategories,
  listBehaviorRecords,
  listBehaviorReviewQueue,
  getBehaviorOverview,
} from "../services/attendanceBehaviorService";
import type {
  AttendanceBehaviorFilters,
  BehaviorCategory,
  BehaviorCategoryListFilters,
  BehaviorOverviewFilters,
  BehaviorOverviewResponse,
  BehaviorRecord,
  BehaviorRecordListFilters,
  BehaviorReviewQueueFilters,
  BehaviorReviewQueueItem,
} from "../types";

// ─── Section config ────────────────────────────────────────────────────────
type BehaviorSection = "categories" | "records" | "review" | "overview";

const DEFAULT_UI_FILTERS: AttendanceBehaviorFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
};

// ─── Overview panel (summary + recent activity + top categories) ───────────
function OverviewPanel({ data }: { data: BehaviorOverviewResponse }) {
  const t = useTranslations("attendance.behavior.overview");
  const summary = (data?.summary || {}) as Record<string, number>;
  const recentActivity = data?.recentActivity || [];
  const topCategories = data?.topCategories || [];

  const stats = [
    { key: "totalRecords", label: t("totalRecords") },
    { key: "submittedRecords", label: t("submittedRecords") },
    { key: "approvedRecords", label: t("approvedRecords") },
    { key: "rejectedRecords", label: t("rejectedRecords") },
    { key: "totalPositivePoints", label: t("totalPositivePoints") },
    { key: "totalNegativePoints", label: t("totalNegativePoints") },
    { key: "netPoints", label: t("netPoints") },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ key, label }) =>
          summary[key] !== undefined ? (
            <div
              key={key}
              className="rounded-xl border p-4 flex flex-col gap-1"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-card)" }}
            >
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {summary[key]}
              </span>
            </div>
          ) : null,
        )}
      </div>

      {/* Recent Activity (only if present in API response) */}
      {recentActivity.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            {t("recentActivity")}
          </h3>
          <ul className="space-y-2">
            {(recentActivity as Record<string, unknown>[]).map((item, i) => (
              <li
                key={i}
                className="rounded-lg border px-4 py-2.5 text-sm"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                {JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Categories (only if present) */}
      {topCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            {t("topCategories")}
          </h3>
          <ul className="space-y-2">
            {(topCategories as Record<string, unknown>[]).map((item, i) => (
              <li
                key={i}
                className="rounded-lg border px-4 py-2.5 text-sm"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                {JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Category Table ────────────────────────────────────────────────────────
function CategoriesTable({
  categories,
  onEdit,
  isReadOnly,
}: {
  categories: BehaviorCategory[];
  onEdit: (cat: BehaviorCategory) => void;
  isReadOnly?: boolean;
}) {
  const t = useTranslations("attendance.behavior");
  
  if (!categories.length) {
    return <AttendanceStatePanel title={t("states.empty.title")} compact />;
  }

  const columns = [
    {
      key: "code",
      label: t("category.code"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {row.code}
        </span>
      ),
    },
    {
      key: "nameEn",
      label: t("category.nameEn"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>{row.nameEn}</span>
      ),
    },
    {
      key: "nameAr",
      label: t("category.nameAr"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <div dir="rtl" className="text-right" style={{ color: "var(--text-primary)" }}>
          {row.nameAr}
        </div>
      ),
    },
    {
      key: "type",
      label: t("category.type"),
      render: (_: unknown, row: any) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border font-medium"
          style={
            row.type === "positive"
              ? { backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }
              : { backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }
          }
        >
          {t(`type.${row.type}`)}
        </span>
      ),
    },
    {
      key: "severity",
      label: t("category.severity"),
      render: (_: unknown, row: any) => (
        <span className="capitalize" style={{ color: "var(--text-primary)" }}>
          {row.defaultSeverity}
        </span>
      ),
    },
    {
      key: "points",
      label: t("category.points"),
      sortable: true,
      render: (_: unknown, row: any) => (
        <span className="font-semibold" style={{ color: row.defaultPoints >= 0 ? "#16a34a" : "#dc2626" }}>
          {row.defaultPoints > 0 ? `+${row.defaultPoints}` : row.defaultPoints}
        </span>
      ),
    },
    {
      key: "active",
      label: t("category.active"),
      render: (_: unknown, row: any) => (
        <span className={`text-xs font-medium ${row.isActive ? "text-green-700" : "text-red-700"}`}>
          {row.isActive ? "✓" : "✗"}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("category.actions"),
      sortable: false,
      render: (_: unknown, row: any) => (
        <div className="flex items-center justify-end">
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              className="text-xs px-2 py-1 rounded border hover:bg-[var(--color-neutral-100)] transition-colors"
              style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
            >
              {t("actions.edit")}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories as unknown as Record<string, unknown>[]}
      showPagination={true}
      itemsPerPage={15}
    />
  );
}

// ─── Review Queue Table ────────────────────────────────────────────────────
function ReviewQueueTable({
  items,
  onApprove,
  onReject,
  isReadOnly,
}: {
  items: BehaviorReviewQueueItem[];
  onApprove: (item: BehaviorReviewQueueItem) => void;
  onReject: (item: BehaviorReviewQueueItem) => void;
  isReadOnly?: boolean;
}) {
  const t = useTranslations("attendance.behavior");
  
  if (!items.length) {
    return <AttendanceStatePanel title={t("states.empty.title")} compact />;
  }

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const columns = [
    {
      key: "student",
      label: t("table.student"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>
          {row.studentName ?? row.studentId ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      label: t("table.category"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>
          {row.categoryName ?? row.categoryId ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_: unknown, row: any) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border"
          style={{ backgroundColor: "#fef3c7", color: "#78350f", borderColor: "#fde68a" }}
        >
          {t(`status.${row.status}`)}
        </span>
      ),
    },
    {
      key: "occurredAt",
      label: t("table.occurredAt"),
      sortable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-muted)" }}>{fmt(row.occurredAt)}</span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(row);
                }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }}
              >
                {t("actions.approve")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(row);
                }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}
              >
                {t("actions.reject")}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items as unknown as Record<string, unknown>[]}
      showPagination={true}
      itemsPerPage={15}
    />
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AttendanceBehaviorPage() {
  const t = useTranslations("attendance.behavior");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const termContext = useAttendanceYearTermLayoutContext();
  const { showSuccess, showError } = useToast();

  // Structure tree for scope header
  const [structure, setStructure] = useState<StructureTree | null>(null);

  // Active section
  const [section, setSection] = useState<BehaviorSection>("records");

  // UI filters (search, type, status, dateFrom, dateTo)
  const [uiFilters, setUiFilters] = useState<AttendanceBehaviorFilters>(DEFAULT_UI_FILTERS);

  // Section data states
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [reviewItems, setReviewItems] = useState<BehaviorReviewQueueItem[]>([]);
  const [overview, setOverview] = useState<BehaviorOverviewResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  // Mobile drawers
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Term resolved from context
  const term = useMemo(
    () => termContext.terms.find((item) => item.id === termContext.termId) || null,
    [termContext.termId, termContext.terms],
  );

  // Sync date filters from term
  useEffect(() => {
    if (!term) return;
    setUiFilters((prev) => ({
      ...prev,
      dateFrom: prev.dateFrom ?? term.startDate,
      dateTo: prev.dateTo ?? term.endDate,
    }));
  }, [term]);

  // Load structure tree
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;
    void fetchStructureTree(termContext.yearId!, termContext.termId!).then(setStructure);
  }, [termContext.yearId, termContext.termId]);

  // ─── Data loaders ──────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    const filters: BehaviorCategoryListFilters = {
      type: uiFilters.type,
      search: uiFilters.search,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorCategories(filters);
      setCategories(res.items);
    } catch {
      const msg = t("messages.loadError");
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [uiFilters.type, uiFilters.search, showError, t]);

  const loadRecords = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;
    const filters: BehaviorRecordListFilters = {
      academicYearId: termContext.yearId,
      termId: termContext.termId,
      status: uiFilters.status,
      type: uiFilters.type,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorRecords(filters);
      setRecords(res.items);
    } catch {
      const msg = t("messages.loadError");
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    termContext.yearId,
    termContext.termId,
    uiFilters.status,
    uiFilters.type,
    uiFilters.dateFrom,
    uiFilters.dateTo,
    showError,
    t,
  ]);

  const loadReviewQueue = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;
    const filters: BehaviorReviewQueueFilters = {
      academicYearId: termContext.yearId,
      termId: termContext.termId,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorReviewQueue(filters);
      setReviewItems(res.items);
    } catch {
      const msg = t("messages.loadError");
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, showError, t]);

  const loadOverview = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;
    const filters: BehaviorOverviewFilters = {
      academicYearId: termContext.yearId,
      termId: termContext.termId,
      includeRecentActivity: true,
      includeTopCategories: true,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await getBehaviorOverview(filters);
      setOverview(res);
    } catch {
      const msg = t("messages.loadError");
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, showError, t]);

  // Reload when section or relevant filters change
  useEffect(() => {
    if (section === "categories") void loadCategories();
    if (section === "records") void loadRecords();
    if (section === "review") void loadReviewQueue();
    if (section === "overview") void loadOverview();
  }, [section, loadCategories, loadRecords, loadReviewQueue, loadOverview]);

  // ─── Action handlers ───────────────────────────────────────────────────
  const handleTableAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    if (action === "view") {
      setSelectedRecord(record);
      return;
    }
    const modeMap: Record<string, BehaviorModalMode> = {
      edit: "edit-record",
      submit: "submit-record",
      approve: "approve-record",
      reject: "reject-record",
    };
    setModalTarget({
      record,
      academicYearId: termContext.yearId ?? undefined,
      termId: termContext.termId ?? undefined,
    });
    setModalMode(modeMap[action] ?? null);
  };

  const handleDrawerAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    setSelectedRecord(null);
    handleTableAction(action, record);
  };

  const openNewModal = () => {
    if (section === "categories") {
      setModalTarget({});
      setModalMode("create-category");
    } else if (section === "records") {
      setModalTarget({
        academicYearId: termContext.yearId ?? undefined,
        termId: termContext.termId ?? undefined,
      });
      setModalMode("create-record");
    }
  };

  const handleModalSuccess = () => {
    if (section === "categories") void loadCategories();
    if (section === "records") void loadRecords();
    if (section === "review") void loadReviewQueue();
  };

  const handleExport = async (format: AttendanceExportFormat) => {
    void format;
    showSuccess(t("messages.exportQueued"));
  };

  const clearFilters = () => {
    setUiFilters({
      scopeType: "SCHOOL",
      scopeIds: {},
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
    });
  };

  // ─── Section label map ─────────────────────────────────────────────────
  const SECTION_LABELS: Record<BehaviorSection, string> = {
    categories: t("sections.categories"),
    records: t("sections.records"),
    review: t("sections.review"),
    overview: t("sections.overview"),
  };

  // ─── Section content renderer ──────────────────────────────────────────
  const renderContent = () => {
    if (loading) return <AttendanceStatePanel title={t("states.loading.title")} compact />;
    if (error) return <AttendanceStatePanel title={error} compact />;

    if (section === "categories") {
      return (
        <CategoriesTable
          categories={categories}
          isReadOnly={termContext.isReadOnly}
          onEdit={(cat) => {
            setModalTarget({ category: cat });
            setModalMode("edit-category");
          }}
        />
      );
    }

    if (section === "records") {
      return (
        <BehaviorTable
          records={records}
          loading={loading}
          error={error}
          onRowClick={setSelectedRecord}
          onAction={handleTableAction}
          isReadOnly={termContext.isReadOnly}
        />
      );
    }

    if (section === "review") {
      return (
        <ReviewQueueTable
          items={reviewItems}
          isReadOnly={termContext.isReadOnly}
          onApprove={(item) => {
            // Map review queue item to a minimal BehaviorRecord for the modal
            const rec: BehaviorRecord = {
              id: item.id,
              studentId: item.studentId ?? "",
              categoryId: item.categoryId ?? "",
              status: item.status,
              points: item.points ?? 0,
              occurredAt: item.occurredAt ?? "",
              type: item.type,
            };
            setModalTarget({ record: rec });
            setModalMode("approve-record");
          }}
          onReject={(item) => {
            const rec: BehaviorRecord = {
              id: item.id,
              studentId: item.studentId ?? "",
              categoryId: item.categoryId ?? "",
              status: item.status,
              points: item.points ?? 0,
              occurredAt: item.occurredAt ?? "",
            };
            setModalTarget({ record: rec });
            setModalMode("reject-record");
          }}
        />
      );
    }

    if (section === "overview") {
      if (!overview) return <AttendanceStatePanel title={t("states.empty.title")} compact />;
      return <OverviewPanel data={overview} />;
    }

    return null;
  };

  const showNewButton = (section === "categories" || section === "records") && !termContext.isReadOnly;

  return (
    <div className="space-y-4 min-h-0 flex-1 p-4">
      <AttendanceScopeHeader
        isReadOnly={termContext.isReadOnly}
        scopeType={uiFilters.scopeType}
        scopeIds={uiFilters.scopeIds}
        stages={structure?.stages || []}
        grades={structure?.grades || []}
        sections={structure?.sections || []}
        classrooms={structure?.classrooms || []}
      />

      {/* Section switcher */}
      <div
        className="rounded-xl border p-2"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(SECTION_LABELS) as BehaviorSection[]).map((item) => (
            <Button
              key={item}
              variant={section === item ? "primary" : "outline"}
              onClick={() => setSection(item)}
            >
              {SECTION_LABELS[item]}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {section !== "overview" && (
        <>
          {isMobile ? (
            <AttendanceMobileActions columns={2}>
              <Button onClick={() => setShowFiltersDrawer(true)} variant="outline">
                <Filter className="h-4 w-4" />
                {t("filters.title")}
              </Button>
              <Button onClick={() => setShowExportModal(true)}>
                {t("export.title")}
              </Button>
            </AttendanceMobileActions>
          ) : (
            <AttendanceFiltersPanel>
              <BehaviorFiltersBar
                filters={uiFilters}
                onChange={(patch) => setUiFilters((prev) => ({ ...prev, ...patch }))}
                onClear={clearFilters}
              />
            </AttendanceFiltersPanel>
          )}
        </>
      )}

      {/* Content area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {SECTION_LABELS[section]}
          </h2>
          {showNewButton && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openNewModal}
            >
              {section === "categories" ? t("actions.newCategory") : t("actions.newRecord")}
            </Button>
          )}
        </div>
        {renderContent()}
      </div>

      {/* Detail drawer */}
      <BehaviorDetailDrawer
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onAction={handleDrawerAction}
        isReadOnly={termContext.isReadOnly}
      />

      {/* Action modals */}
      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={handleModalSuccess}
      />

      {/* Mobile filter drawer */}
      <AttendanceBottomDrawer
        onClose={() => setShowFiltersDrawer(false)}
        isOpen={showFiltersDrawer}
      >
        <div className="p-4">
          <BehaviorFiltersBar
            filters={uiFilters}
            onChange={(patch) => setUiFilters((prev) => ({ ...prev, ...patch }))}
            onClear={clearFilters}
          />
        </div>
      </AttendanceBottomDrawer>

      {/* Export modal */}
      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={
          section === "categories"
            ? categories.length
            : section === "records"
              ? records.length
              : reviewItems.length
        }
      />
    </div>
  );
}

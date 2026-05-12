"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import { fetchStructureTree, type StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceExportFormat } from "@/features/attendance/shared/utils/attendanceExport";
import BehaviorFiltersBar from "../components/BehaviorFiltersBar";
import BehaviorTable from "../components/BehaviorTable";
import BehaviorDetailDrawer from "../components/BehaviorDetailDrawer";
import BehaviorActionModals from "../components/BehaviorActionModals";
import { fetchAttendanceBehavior } from "../services/attendanceBehaviorService";
import type { AttendanceBehaviorFilters, AttendanceBehaviorRow } from "../types";

type BehaviorSection = "categories" | "records" | "review" | "overview";

const DEFAULT_FILTERS: AttendanceBehaviorFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
  incidentType: "ALL",
};

const SECTION_LABELS: Record<BehaviorSection, string> = {
  categories: "Categories management",
  records: "Records management",
  review: "Review queue",
  overview: "Overview & reports",
};

export default function AttendanceBehaviorPage() {
  const t = useTranslations("attendance.reportsPage");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const termContext = useAttendanceYearTermLayoutContext();
  const { showSuccess, showError } = useToast();

  const [structure, setStructure] = useState<StructureTree | null>(null);
  const [filters, setFilters] = useState<AttendanceBehaviorFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<AttendanceBehaviorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AttendanceBehaviorRow | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [section, setSection] = useState<BehaviorSection>("categories");

  const term = useMemo(
    () => termContext.terms.find((item) => item.id === termContext.termId) || null,
    [termContext.termId, termContext.terms],
  );

  useEffect(() => {
    if (!term) return;
    setFilters((prev) => ({
      ...prev,
      dateFrom: term.startDate,
      dateTo: term.endDate,
    }));
  }, [term]);

  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      const tree = await fetchStructureTree(termContext.yearId!, termContext.termId!);
      setStructure(tree);
    };

    void loadStructure();
  }, [termContext.termId, termContext.yearId]);

  const loadBehavior = useCallback(async () => {
    if (!filters.dateFrom || !filters.dateTo) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAttendanceBehavior(filters);
      setRows(response.rows);
    } catch {
      setError("Unable to load attendance behavior data.");
      showError("Unable to load attendance behavior data.");
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    void loadBehavior();
  }, [loadBehavior]);

  const handleExport = async (format: AttendanceExportFormat) => {
    void format;
    showSuccess("Export has been queued.");
  };

  const renderSectionContent = () => {
    if (loading) return <AttendanceStatePanel title={t("states.loading.title")} compact />;
    if (error) return <AttendanceStatePanel title={error} compact />;
    if (!rows.length) return <AttendanceStatePanel title={t("states.empty.title")} compact />;

    if (section === "overview") {
      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Overview panel</p>
          <BehaviorTable rows={rows} onRowClick={setSelectedRow} />
        </div>
      );
    }

    return <BehaviorTable rows={rows} onRowClick={setSelectedRow} />;
  };

  return (
    <div className="space-y-4">
      <AttendanceScopeHeader
        isReadOnly={termContext.isReadOnly}
        readOnlyMessage={termContext.readOnlyMessage}
        scopeType={filters.scopeType}
        scopeIds={filters.scopeIds}
        stages={structure?.stages || []}
        grades={structure?.grades || []}
        sections={structure?.sections || []}
        classrooms={structure?.classrooms || []}
      />

      <div className="rounded-xl border p-2" style={{ borderColor: "var(--border-color)" }}>
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

      {isMobile ? (
        <AttendanceMobileActions columns={2}>
          <Button onClick={() => setShowFiltersDrawer(true)} variant="outline">
            <Filter className="h-4 w-4" />
            {t("filters.title")}
          </Button>
          <Button onClick={() => setShowExportModal(true)}>{t("export.title")}</Button>
        </AttendanceMobileActions>
      ) : (
        <AttendanceFiltersPanel>
          <BehaviorFiltersBar filters={filters} onChange={setFilters} />
        </AttendanceFiltersPanel>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{SECTION_LABELS[section]}</h2>
          <Button variant="outline" onClick={() => setShowActionModal(true)}>New / Edit</Button>
        </div>
        {renderSectionContent()}
      </div>

      <BehaviorDetailDrawer row={selectedRow} isOpen={!!selectedRow} onClose={() => setSelectedRow(null)} />
      <BehaviorActionModals isOpen={showActionModal} onClose={() => setShowActionModal(false)} />

      <AttendanceBottomDrawer
        open={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        title={t("filters.title")}
      >
        <BehaviorFiltersBar filters={filters} onChange={setFilters} />
      </AttendanceBottomDrawer>

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={rows.length}
      />
    </div>
  );
}

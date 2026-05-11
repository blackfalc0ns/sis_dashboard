"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import Button from "@/components/ui/button/Button";
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

const DEFAULT_FILTERS: AttendanceBehaviorFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
  incidentType: "ALL",
};

export default function AttendanceBehaviorPage() {
  const t = useTranslations("attendance.reportsPage");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const termContext = useAttendanceYearTermLayoutContext();

  const [structure, setStructure] = useState<StructureTree | null>(null);
  const [filters, setFilters] = useState<AttendanceBehaviorFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<AttendanceBehaviorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AttendanceBehaviorRow | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadBehavior();
  }, [loadBehavior]);

  const handleExport = async (format: AttendanceExportFormat) => {
    void format;
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

      {loading ? <AttendanceStatePanel title={t("states.loading.title")} compact /> : null}
      {error ? <AttendanceStatePanel title={error} compact /> : null}
      {!loading && !error ? <BehaviorTable rows={rows} onRowClick={setSelectedRow} /> : null}

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

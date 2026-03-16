"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Filter } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
import AttendanceDetailsCard from "@/features/attendance/shared/components/AttendanceDetailsCard";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import AbsencesKpisBar from "../components/AbsencesKpisBar";
import AbsencesFiltersBar from "../components/AbsencesFiltersBar";
import AbsencesFiltersDrawer from "../components/AbsencesFiltersDrawer";
import AbsencesTable from "../components/AbsencesTable";
import AbsenceDetailsPanel from "../components/AbsenceDetailsPanel";
import ExcuseModal from "@/features/attendance/roll-call/components/ExcuseModal";
import EarlyLeaveEditorModal from "../components/EarlyLeaveEditorModal";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import {
  fetchAbsenceRecords,
  computeAbsencesKPIs,
  updateExcuse,
  updateEarlyLeaveMinutes,
} from "../services/attendanceAbsencesService";
import { exportAbsencesToExcel } from "../utils/absencesExport";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  resolveEffectiveExcusePolicy,
  type EffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type { AbsenceRecord, AbsencesFilters } from "../types";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";

export default function AttendanceAbsencesPage() {
  const t = useTranslations("attendance.absences");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceTermContext();
  const [structureTree, setStructureTree] = useState<StructureTree | null>(null);

  const isReadOnly = termContext.isReadOnly;

  // State
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AbsenceRecord | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // Filters - Updated to single status and PERIOD only
  const [filters, setFilters] = useState<AbsencesFilters>({
    scopeType: "SCHOOL",
    status: "ALL",
    granularities: ["PERIOD"], // Fixed to PERIOD only
    onlyUnexcused: false,
    search: "",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modals
  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [earlyLeaveModalOpen, setEarlyLeaveModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AbsenceRecord | null>(null);
  const [excusePolicy, setExcusePolicy] = useState<EffectiveExcusePolicy | null>(null);

  // Reusable reload function
  const reloadRecords = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;

    setIsLoading(true);
    try {
      const data = await fetchAbsenceRecords({
        yearId: termContext.yearId,
        termId: termContext.termId,
        ...filters,
      });
      setRecords(data);
    } catch (error) {
      console.error("Failed to load absences:", error);
      showError(tCommon("error_loading"));
    } finally {
      setIsLoading(false);
    }
  }, [termContext.yearId, termContext.termId, filters, showError, tCommon]);

  // Load structure tree when year/term changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(termContext.yearId!, termContext.termId!);
        setStructureTree(tree);
      } catch (error) {
        console.error("Failed to load structure tree:", error);
      }
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  // Load data when filters change
  useEffect(() => {
    reloadRecords();
  }, [reloadRecords]);

  // Compute KPIs
  const kpis = useMemo(() => computeAbsencesKPIs(records), [records]);

  // Handlers
  const handleAcademicYearChange = (yearId: string) => {
    termContext.setYearId(yearId);
  };

  const handleTermChange = (newTermId: string) => {
    termContext.setTermId(newTermId);
  };

  const handleFiltersChange = (newFilters: Partial<AbsencesFilters>) => {
    if ('search' in newFilters) {
      setSearchInput(newFilters.search || "");
    }
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({
      scopeType: "SCHOOL",
      status: "ALL",
      granularities: ["PERIOD"],
      onlyUnexcused: false,
      search: "",
    });
  };

  const handleRecordClick = (record: AbsenceRecord) => {
    setSelectedRecord(record);
    if (isMobile) {
      setShowDetailsDrawer(true);
    }
  };

  const handleEditExcuse = async (record: AbsenceRecord) => {
    if (isReadOnly) return;

    try {
      // Resolve effective policy for this record
      const policy = await resolveEffectiveExcusePolicy(
        termContext.yearId!,
        termContext.termId!,
        record.scopeType,
        record.scopeIds,
        record.date
      );

      // Check if excuses are allowed by policy
      if (!policy.allowExcuses) {
        showError(t("messages.excusesDisabledByPolicy"));
        return;
      }

      // Set policy and open modal
      setExcusePolicy(policy);
      setRecordToEdit(record);
      setExcuseModalOpen(true);
    } catch (error) {
      console.error("Failed to resolve excuse policy:", error);
      showError(tCommon("error_loading"));
    }
  };

  const handleEditEarlyLeave = (record: AbsenceRecord) => {
    if (isReadOnly) return;
    setRecordToEdit(record);
    setEarlyLeaveModalOpen(true);
  };

  const handleSaveExcuse = async (reason: string, attachments: AttachmentMeta[]) => {
    if (!recordToEdit) return;

    try {
      await updateExcuse(recordToEdit, reason, attachments);
      showSuccess(t("excuseSaved"));
      await reloadRecords();
    } catch (error) {
      console.error("Failed to save excuse:", error);
      showError(tCommon("save_failed"));
    }
  };

  const handleSaveEarlyLeave = async (minutes: number) => {
    if (!recordToEdit) return;

    try {
      await updateEarlyLeaveMinutes(recordToEdit, minutes);
      showSuccess(t("minutesSaved"));
      await reloadRecords();
    } catch (error) {
      console.error("Failed to save minutes:", error);
      showError(tCommon("save_failed"));
    }
  };

  const handleExport = () => {
    if (!termContext.yearId || !termContext.termId) return;

    // Get year and term names
    const yearName = termContext.yearId; // TODO: Get actual name from context
    const termName = termContext.termId; // TODO: Get actual name from context
    const scopeName = getAttendanceScopeLabel({
      scopeType: filters.scopeType,
      scopeIds: filters.scopeIds,
      stages: structureTree?.stages || [],
      grades: structureTree?.grades || [],
      sections: structureTree?.sections || [],
      classrooms: structureTree?.classrooms || [],
      locale,
    });

    exportAbsencesToExcel(records, locale, {
      yearName,
      termName,
      scopeName,
      dateRange: filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} - ${filters.dateTo}`
        : locale === "ar"
        ? "جميع التواريخ"
        : "All dates",
    });

    showSuccess(t("exportSuccess"));
  };

  // Empty states
  if (!termContext.yearId || !termContext.termId) {
    return (
      <div className="flex flex-col h-screen">
        <ContextBar
          academicYearId={termContext.yearId || ""}
          termId={termContext.termId || ""}
          termStatus={termContext.termStatus || "open"}
          onAcademicYearChange={handleAcademicYearChange}
          onTermChange={handleTermChange}
          isReadOnly={isReadOnly}
          showPromoteCarryOver={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <AttendanceStatePanel
            title={t("emptyStates.noYearTerm.title")}
            description={t("emptyStates.noYearTerm.description")}
          />
        </div>
      </div>
    );
  }

  const isScopeSelectionIncomplete = !isScopeSelectionComplete(filters.scopeType, filters.scopeIds);

  return (
    <div className="flex flex-col">
      {/* Context Bar */}
      <ContextBar
        academicYearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termStatus={termContext.termStatus || "open"}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      <div className="flex-1 flex flex-col gap-4 p-4 min-h-0">
        <AttendanceScopeHeader
          isReadOnly={isReadOnly}
          readOnlyMessage={t("readonly_banner")}
          scopeType={filters.scopeType}
          scopeIds={filters.scopeIds}
          stages={structureTree?.stages || []}
          grades={structureTree?.grades || []}
          sections={structureTree?.sections || []}
          classrooms={structureTree?.classrooms || []}
        />

        {/* KPIs */}
        <AbsencesKpisBar kpis={kpis} />

        {/* Desktop Layout */}
        {!isMobile && (
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            {/* Left: Filters + Table */}
            <div className="col-span-8 flex flex-col gap-4 min-h-0">
              <AttendanceFiltersPanel className="rounded-lg">
                <AbsencesFiltersBar
                  filters={{ ...filters, search: searchInput }}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  onExport={handleExport}
                  isReadOnly={isReadOnly}
                  structureTree={structureTree}
                />
              </AttendanceFiltersPanel>
              <AttendanceDataPanel
                loading={isLoading}
                className="flex-1 rounded-lg border overflow-hidden min-h-0"
                loaderClassName="flex items-center justify-center h-full"
              >
                {isScopeSelectionIncomplete ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.selectScope.title")}
                    description={t("emptyStates.selectScope.description")}
                  />
                ) : records.length === 0 ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.noRecords.title")}
                    description={t("emptyStates.noRecords.description")}
                  />
                ) : (
                  <AbsencesTable
                    records={records}
                    onRecordClick={handleRecordClick}
                    onEditExcuse={handleEditExcuse}
                    onEditEarlyLeave={handleEditEarlyLeave}
                    isReadOnly={isReadOnly}
                  />
                )}
              </AttendanceDataPanel>
            </div>

            {/* Right: Details Panel */}
            <AttendanceDetailsCard className="rounded-lg">
              <AbsenceDetailsPanel
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
                onEditExcuse={handleEditExcuse}
                onEditEarlyLeave={handleEditEarlyLeave}
                isReadOnly={isReadOnly}
              />
            </AttendanceDetailsCard>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <AttendanceMobileActions>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFiltersDrawer(true)}
              >
                {t("filters.filters")}
              </Button>
            </AttendanceMobileActions>
            {/* Table */}
            <AttendanceDataPanel
              loading={isLoading}
              className="flex-1 rounded-lg border overflow-hidden min-h-0"
              loaderClassName="flex items-center justify-center h-full"
            >
              {isScopeSelectionIncomplete ? (
                <AttendanceStatePanel
                  title={t("emptyStates.selectScope.title")}
                  description={t("emptyStates.selectScope.description")}
                />
              ) : records.length === 0 ? (
                <AttendanceStatePanel
                  title={t("emptyStates.noRecords.title")}
                  description={t("emptyStates.noRecords.description")}
                />
              ) : (
                <AbsencesTable
                  records={records}
                  onRecordClick={handleRecordClick}
                  onEditExcuse={handleEditExcuse}
                  onEditEarlyLeave={handleEditEarlyLeave}
                  isReadOnly={isReadOnly}
                />
              )}
            </AttendanceDataPanel>
          </div>
        )}

        {/* Mobile Filters Drawer */}
        <AbsencesFiltersDrawer
          isOpen={showFiltersDrawer}
          onClose={() => setShowFiltersDrawer(false)}
          filters={{ ...filters, search: searchInput }}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
          structureTree={structureTree}
        />

        {/* Mobile Details Drawer */}
        <AttendanceBottomDrawer isOpen={showDetailsDrawer} onClose={() => setShowDetailsDrawer(false)}>
          <AbsenceDetailsPanel
            record={selectedRecord}
            onClose={() => setShowDetailsDrawer(false)}
            onEditExcuse={handleEditExcuse}
            onEditEarlyLeave={handleEditEarlyLeave}
            isReadOnly={isReadOnly}
          />
        </AttendanceBottomDrawer>

        {/* Excuse Modal */}
        <ExcuseModal
          isOpen={excuseModalOpen}
          onClose={() => {
            setExcuseModalOpen(false);
            setRecordToEdit(null);
            setExcusePolicy(null);
          }}
          onSave={handleSaveExcuse}
          initialReason={recordToEdit?.excuse?.reasonAr || recordToEdit?.excuse?.reasonEn || ""}
          initialAttachments={recordToEdit?.excuse?.attachments || []}
          requireAttachment={excusePolicy?.requireAttachmentForExcuse ?? false}
          isReadOnly={isReadOnly}
        />

        {/* Early Leave Modal */}
        <EarlyLeaveEditorModal
          isOpen={earlyLeaveModalOpen}
          onClose={() => {
            setEarlyLeaveModalOpen(false);
            setRecordToEdit(null);
          }}
          onSave={handleSaveEarlyLeave}
          initialMinutes={recordToEdit?.minutesEarlyLeave || 0}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
}






"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Drawer } from "@mui/material";
import { Filter, AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "@/features/academics/components/shared/ContextBar";
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
import type { AbsenceRecord, AbsencesFilters } from "../types";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

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

  // Get scope name for export
  const getScopeName = useCallback(() => {
    if (!structureTree) return locale === "ar" ? "المدرسة" : "School";

    switch (filters.scopeType) {
      case "SCHOOL":
        return locale === "ar" ? "المدرسة" : "School";
      case "STAGE":
        if (filters.scopeIds?.stageId) {
          const stage = structureTree.stages.find(s => s.id === filters.scopeIds?.stageId);
          return stage ? (locale === "ar" ? stage.nameAr : stage.nameEn) : "";
        }
        break;
      case "GRADE":
        if (filters.scopeIds?.gradeId) {
          const grade = structureTree.grades.find(g => g.id === filters.scopeIds?.gradeId);
          return grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : "";
        }
        break;
      case "SECTION":
        if (filters.scopeIds?.sectionId) {
          const section = structureTree.sections.find(s => s.id === filters.scopeIds?.sectionId);
          return section ? (locale === "ar" ? section.nameAr : section.nameEn) : "";
        }
        break;
    }
    return "";
  }, [structureTree, filters.scopeType, filters.scopeIds, locale]);

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
    const scopeName = getScopeName();

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
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "var(--text-muted)" }} />
            <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              {t("emptyStates.noYearTerm.title")}
            </h3>
            <p style={{ color: "var(--text-muted)" }}>
              {t("emptyStates.noYearTerm.description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if scope selection is required but missing
  const isScopeSelectionIncomplete = 
    (filters.scopeType === "STAGE" && !filters.scopeIds?.stageId) ||
    (filters.scopeType === "GRADE" && (!filters.scopeIds?.stageId || !filters.scopeIds?.gradeId)) ||
    (filters.scopeType === "SECTION" && (!filters.scopeIds?.stageId || !filters.scopeIds?.gradeId || !filters.scopeIds?.sectionId));

  return (
    <div className="flex flex-col h-screen">
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
        {/* Read-only Banner */}
        {isReadOnly && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: "var(--color-warning-50)",
              color: "var(--color-warning-800)",
              borderLeft: "4px solid var(--color-warning-500)",
            }}
          >
            {t("readonly_banner")}
          </div>
        )}

        {/* KPIs */}
        <AbsencesKpisBar kpis={kpis} />

        {/* Desktop Layout */}
        {!isMobile && (
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            {/* Left: Filters + Table */}
            <div className="col-span-8 flex flex-col gap-4 min-h-0">
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--card-background)",
                  borderColor: "var(--border-color)",
                }}
              >
                <AbsencesFiltersBar
                  filters={{ ...filters, search: searchInput }}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  onExport={handleExport}
                  isReadOnly={isReadOnly}
                  structureTree={structureTree}
                />
              </div>

              <div
                className="flex-1 rounded-lg border overflow-hidden min-h-0"
                style={{
                  backgroundColor: "var(--card-background)",
                  borderColor: "var(--border-color)",
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <PartialLoader />
                  </div>
                ) : isScopeSelectionIncomplete ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                      <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                        {t("emptyStates.selectScope.title")}
                      </h3>
                      <p style={{ color: "var(--text-muted)" }}>
                        {t("emptyStates.selectScope.description")}
                      </p>
                    </div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                      <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                        {t("emptyStates.noRecords.title")}
                      </h3>
                      <p style={{ color: "var(--text-muted)" }}>
                        {t("emptyStates.noRecords.description")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AbsencesTable
                    records={records}
                    onRecordClick={handleRecordClick}
                    onEditExcuse={handleEditExcuse}
                    onEditEarlyLeave={handleEditEarlyLeave}
                    isReadOnly={isReadOnly}
                  />
                )}
              </div>
            </div>

            {/* Right: Details Panel */}
            <div
              className="col-span-4 rounded-lg border overflow-hidden"
              style={{
                backgroundColor: "var(--card-background)",
                borderColor: "var(--border-color)",
              }}
            >
              <AbsenceDetailsPanel
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
                onEditExcuse={handleEditExcuse}
                onEditEarlyLeave={handleEditEarlyLeave}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Filters Button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFiltersDrawer(true)}
            >
              {t("filters.filters")}
            </Button>

            {/* Table */}
            <div
              className="flex-1 rounded-lg border overflow-hidden min-h-0"
              style={{
                backgroundColor: "var(--card-background)",
                borderColor: "var(--border-color)",
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <PartialLoader />
                </div>
              ) : isScopeSelectionIncomplete ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                    <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                      {t("emptyStates.selectScope.title")}
                    </h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      {t("emptyStates.selectScope.description")}
                    </p>
                  </div>
                </div>
              ) : records.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                    <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                      {t("emptyStates.noRecords.title")}
                    </h3>
                    <p style={{ color: "var(--text-muted)" }}>
                      {t("emptyStates.noRecords.description")}
                    </p>
                  </div>
                </div>
              ) : (
                <AbsencesTable
                  records={records}
                  onRecordClick={handleRecordClick}
                  onEditExcuse={handleEditExcuse}
                  onEditEarlyLeave={handleEditEarlyLeave}
                  isReadOnly={isReadOnly}
                />
              )}
            </div>
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
        <Drawer
          anchor="bottom"
          open={showDetailsDrawer}
          onClose={() => setShowDetailsDrawer(false)}
        >
          <div className="h-[80vh]">
            <AbsenceDetailsPanel
              record={selectedRecord}
              onClose={() => setShowDetailsDrawer(false)}
              onEditExcuse={handleEditExcuse}
              onEditEarlyLeave={handleEditEarlyLeave}
              isReadOnly={isReadOnly}
            />
          </div>
        </Drawer>

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
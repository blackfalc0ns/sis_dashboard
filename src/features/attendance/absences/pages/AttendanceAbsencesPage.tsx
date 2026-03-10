"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Drawer } from "@mui/material";
import { Filter } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import AbsencesKpisBar from "../components/AbsencesKpisBar";
import AbsencesFiltersBar from "../components/AbsencesFiltersBar";
import AbsencesFiltersDrawer from "../components/AbsencesFiltersDrawer";
import AbsencesTable from "../components/AbsencesTable";
import AbsenceDetailsPanel from "../components/AbsenceDetailsPanel";
import ExcuseModal from "@/features/attendance/roll-call/components/ExcuseModal";
import EarlyLeaveEditorModal from "../components/EarlyLeaveEditorModal";
import {
  fetchAbsenceRecords,
  computeAbsencesKPIs,
  updateExcuse,
  updateEarlyLeaveMinutes,
} from "../services/attendanceAbsencesService";
import { exportAbsencesToExcel } from "../utils/absencesExport";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type Term,
  type AcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AbsenceRecord, AbsencesFilters } from "../types";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

export default function AttendanceAbsencesPage() {
  const t = useTranslations("attendance.absences");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Academic context
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  const isReadOnly = termStatus === "closed";

  // State
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AbsenceRecord | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  // Filters
  const [filters, setFilters] = useState<AbsencesFilters>({
    scopeType: "SCHOOL",
    statuses: [],
    granularities: ["PERIOD", "DAILY_DERIVED"],
    onlyUnexcused: false,
    search: "",
  });

  // Modals
  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [earlyLeaveModalOpen, setEarlyLeaveModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AbsenceRecord | null>(null);

  // Load academic context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const allYears = await fetchAcademicYears();
        setYears(allYears);

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const year = allYears.find((y) => y.id === urlYear) || allYears[0];
        if (!year) return;

        setSelectedYear(year);

        const yearTerms = await fetchTermsByYear(year.id);
        setTerms(yearTerms);

        let term = yearTerms.find((t) => t.id === urlTerm);
        if (!term) {
          term = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (term) {
          setSelectedTerm(term);
          setTermStatus(term.status);

          const params = new URLSearchParams();
          params.set("year", year.id);
          params.set("term", term.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to load context:", error);
      }
    };

    loadContext();
  }, [searchParams, router]);

  // Load data
  useEffect(() => {
    if (!selectedYear || !selectedTerm) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAbsenceRecords({
          yearId: selectedYear.id,
          termId: selectedTerm.id,
          ...filters,
        });
        setRecords(data);
      } catch (error) {
        console.error("Failed to load absences:", error);
        showError(tCommon("error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedTerm, filters, tCommon, showError]);

  // Compute KPIs
  const kpis = useMemo(() => computeAbsencesKPIs(records), [records]);

  // Handlers
  const handleFiltersChange = (newFilters: Partial<AbsencesFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      scopeType: "SCHOOL",
      statuses: [],
      granularities: ["PERIOD", "DAILY_DERIVED"],
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

  const handleEditExcuse = (record: AbsenceRecord) => {
    setRecordToEdit(record);
    setExcuseModalOpen(true);
  };

  const handleEditEarlyLeave = (record: AbsenceRecord) => {
    setRecordToEdit(record);
    setEarlyLeaveModalOpen(true);
  };

  const handleSaveExcuse = async (reason: string, attachments: AttachmentMeta[]) => {
    if (!recordToEdit) return;

    try {
      await updateExcuse(recordToEdit, reason, attachments);
      showSuccess(t("excuseSaved"));
      
      // Reload data
      if (selectedYear && selectedTerm) {
        const data = await fetchAbsenceRecords({
          yearId: selectedYear.id,
          termId: selectedTerm.id,
          ...filters,
        });
        setRecords(data);
      }
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
      
      // Reload data
      if (selectedYear && selectedTerm) {
        const data = await fetchAbsenceRecords({
          yearId: selectedYear.id,
          termId: selectedTerm.id,
          ...filters,
        });
        setRecords(data);
      }
    } catch (error) {
      console.error("Failed to save minutes:", error);
      showError(tCommon("save_failed"));
    }
  };

  const handleExport = () => {
    if (!selectedYear || !selectedTerm) return;

    exportAbsencesToExcel(records, locale, {
      yearName: locale === "ar" ? (selectedYear.nameAr || selectedYear.nameEn || "") : (selectedYear.nameEn || selectedYear.nameAr || ""),
      termName: locale === "ar" ? (selectedTerm.nameAr || selectedTerm.nameEn || "") : (selectedTerm.nameEn || selectedTerm.nameAr || ""),
      scopeName: locale === "ar" ? "المدرسة" : "School",
      dateRange: filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} - ${filters.dateTo}`
        : locale === "ar"
        ? "جميع التواريخ"
        : "All dates",
    });

    showSuccess(t("exportSuccess"));
  };

  if (!selectedYear || !selectedTerm) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t("selectYearTerm")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
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
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                onExport={handleExport}
                isReadOnly={isReadOnly}
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
                  <PartialLoader/>
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
                <p className="text-gray-500">{tCommon("loading")}</p>
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
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
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
        }}
        onSave={handleSaveExcuse}
        initialReason={recordToEdit?.excuse?.reasonAr || recordToEdit?.excuse?.reasonEn || ""}
        initialAttachments={recordToEdit?.excuse?.attachments || []}
        requireAttachment={false}
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
  );
}

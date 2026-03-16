"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
import AttendanceDetailsCard from "@/features/attendance/shared/components/AttendanceDetailsCard";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { fetchIncidents, updateIncidentMinutes } from "../services/attendanceLateEarlyService";
import { exportLateEarly } from "../utils/lateEarlyExport";
import type { Incident, LateEarlyFilters, LateEarlyKpis } from "../types";
import LateEarlyKpisBar from "../components/LateEarlyKpisBar";
import LateEarlyFiltersBar from "../components/LateEarlyFiltersBar";
import LateEarlyFiltersDrawer from "../components/LateEarlyFiltersDrawer";
import LateEarlyTable from "../components/LateEarlyTable";
import IncidentDetailsDrawer from "../components/IncidentDetailsDrawer";
import MinutesEditorModal from "../components/MinutesEditorModal";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import MainLoader from "@/components/ui/loaders/MainLoader";

function computeKpis(incidents: Incident[]): LateEarlyKpis {
  const late = incidents.filter((incident) => incident.type === "LATE");
  const early = incidents.filter((incident) => incident.type === "EARLY_LEAVE");

  const average = (values: number[]) => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  return {
    totalIncidents: incidents.length,
    totalLate: late.length,
    totalEarlyLeave: early.length,
    avgLateMinutes: average(late.map((incident) => incident.minutes)),
    avgEarlyLeaveMinutes: average(early.map((incident) => incident.minutes)),
    violationsCount: incidents.filter((incident) => incident.isViolation).length,
  };
}

export default function AttendanceLateEarlyPage() {
  const t = useTranslations("attendance.lateEarly");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceTermContext();

  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [periods, setPeriods] = useState<Array<{ index: number; nameAr: string; nameEn: string }>>([]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<LateEarlyFilters>({
    scopeType: "SCHOOL",
    scopeIds: {},
    type: "ALL",
    onlyViolations: false,
    search: "",
    sessionStatus: "ALL",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [minutesEditorOpen, setMinutesEditorOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  const isReadOnly = termContext.isReadOnly;
  const kpis = useMemo(() => computeKpis(incidents), [incidents]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setFilters({
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
      scopeType: "SCHOOL",
      scopeIds: {},
      type: "ALL",
      onlyViolations: false,
      search: "",
      sessionStatus: "ALL",
    });
  }, [term?.endDate, term?.startDate]);

  const reloadIncidents = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;

    setLoading(true);
    try {
      const list = await fetchIncidents({ yearId: termContext.yearId, termId: termContext.termId, ...filters });
      setIncidents(list);
      
      // Update selected incident if it exists in the new list
      setSelectedIncident((prev) => {
        if (!prev) return null;
        return list.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      console.error("Failed to load incidents", error);
      showError(tCommon("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, filters, showError, tCommon]);

  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      const [structure, termConfig] = await Promise.all([
        fetchStructureTree(termContext.yearId!, termContext.termId!),
        fetchTimetableConfig(termContext.termId!, "TERM"),
      ]);

      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);
      setClassrooms(structure.classrooms);
      setPeriods(termConfig?.periods || []);
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  useEffect(() => {
    reloadIncidents();
  }, [reloadIncidents]);

  const handleExport = (format: "csv" | "excel") => {
    if (!term) return;

    exportLateEarly(incidents, locale, format, {
      yearName: termContext.yearId || "",
      termName: locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name,
      scopeName: getAttendanceScopeLabel({
        scopeType: filters.scopeType,
        scopeIds: filters.scopeIds,
        stages,
        grades,
        sections,
        classrooms,
        locale,
        schoolLabel: t("scopeSchool"),
      }),
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleOpenIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    if (isMobile) {
      setDetailsDrawerOpen(true);
    }
  };

  const handleEditMinutes = (incident: Incident) => {
    if (isReadOnly) return;
    setEditingIncident(incident);
    setMinutesEditorOpen(true);
  };

  const handleSaveMinutes = async (minutes: number) => {
    if (!editingIncident) return;

    try {
      await updateIncidentMinutes({
        yearId: editingIncident.yearId,
        termId: editingIncident.termId,
        sessionId: editingIncident.sessionId,
        studentId: editingIncident.studentId,
        type: editingIncident.type,
        minutes,
      });
      showSuccess(t("minutesSaved"));
      await reloadIncidents();
    } catch (error) {
      console.error("Failed to update minutes", error);
      showError(tCommon("save_failed"));
      throw error;
    }
  };

  if (termContext.isLoading) {
    return (
     <MainLoader />
    );
  }

  if (!termContext.yearId || !termContext.termId) {
    return (
      <div className="flex flex-col h-screen">
        <ContextBar
          academicYearId={termContext.yearId || ""}
          termId={termContext.termId || ""}
          termStatus={termContext.termStatus || "open"}
          onAcademicYearChange={termContext.setYearId}
          onTermChange={termContext.setTermId}
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
      <ContextBar
        academicYearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termStatus={termContext.termStatus || "open"}
        onAcademicYearChange={termContext.setYearId}
        onTermChange={termContext.setTermId}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0" style={{ backgroundColor: "var(--background)" }}>
        <AttendanceScopeHeader
          isReadOnly={isReadOnly}
          readOnlyMessage={t("readonlyBanner")}
          scopeType={filters.scopeType}
          scopeIds={filters.scopeIds}
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
        />
        <LateEarlyKpisBar kpis={kpis} />

        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 min-h-0 flex-1">
            <div className="col-span-8 min-h-0 flex flex-col gap-4">
              <AttendanceFiltersPanel>
                <LateEarlyFiltersBar
                  filters={{ ...filters, search: searchInput }}
                  stages={stages}
                  grades={grades}
                  sections={sections}
                  classrooms={classrooms}
                  periods={periods}
                  onFiltersChange={(patch) => {
                    if ('search' in patch) {
                      setSearchInput(patch.search || "");
                    }
                    setFilters((prev) => ({ ...prev, ...patch }));
                  }}
                  onResetFilters={resetFilters}
                  onExport={handleExport}
                />
              </AttendanceFiltersPanel>

              <AttendanceDataPanel loading={loading}>
                {isScopeSelectionIncomplete ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.selectScope.title")}
                    description={t("emptyStates.selectScope.description")}
                  />
                ) : incidents.length === 0 ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.noRecords.title")}
                    description={t("emptyStates.noRecords.description")}
                  />
                ) : (
                  <LateEarlyTable
                    incidents={incidents}
                    isReadOnly={isReadOnly}
                    onView={handleOpenIncident}
                    onEditMinutes={handleEditMinutes}
                  />
                )}
              </AttendanceDataPanel>
            </div>

            <AttendanceDetailsCard>
              <IncidentDetailsDrawer
                incident={selectedIncident}
                isReadOnly={isReadOnly}
                onClose={() => setSelectedIncident(null)}
                onEditMinutes={handleEditMinutes}
              />
            </AttendanceDetailsCard>
          </div>
        )}

        {isMobile && (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <AttendanceMobileActions>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setFiltersDrawerOpen(true)}
              >
                {t("filters.filters")}
              </Button>
            </AttendanceMobileActions>

            <AttendanceDataPanel loading={loading}>
              {isScopeSelectionIncomplete ? (
                <AttendanceStatePanel
                  title={t("emptyStates.selectScope.title")}
                  description={t("emptyStates.selectScope.description")}
                />
              ) : incidents.length === 0 ? (
                <AttendanceStatePanel
                  title={t("emptyStates.noRecords.title")}
                  description={t("emptyStates.noRecords.description")}
                />
              ) : (
                <LateEarlyTable
                  incidents={incidents}
                  isReadOnly={isReadOnly}
                  onView={handleOpenIncident}
                  onEditMinutes={handleEditMinutes}
                />
              )}
            </AttendanceDataPanel>
          </div>
        )}
      </div>

      <LateEarlyFiltersDrawer
        isOpen={filtersDrawerOpen}
        filters={{ ...filters, search: searchInput }}
        stages={stages}
        grades={grades}
        sections={sections}
        classrooms={classrooms}
        periods={periods}
        onClose={() => setFiltersDrawerOpen(false)}
        onApply={() => setFiltersDrawerOpen(false)}
        onFiltersChange={(patch) => {
          if ('search' in patch) {
            setSearchInput(patch.search || "");
          }
          setFilters((prev) => ({ ...prev, ...patch }));
        }}
        onResetFilters={resetFilters}
        onExport={handleExport}
      />

      <AttendanceBottomDrawer isOpen={detailsDrawerOpen} onClose={() => setDetailsDrawerOpen(false)}>
        <IncidentDetailsDrawer
          incident={selectedIncident}
          isReadOnly={isReadOnly}
          onClose={() => setDetailsDrawerOpen(false)}
          onEditMinutes={handleEditMinutes}
        />
      </AttendanceBottomDrawer>

      <MinutesEditorModal
        isOpen={minutesEditorOpen}
        type={editingIncident?.type || "LATE"}
        initialMinutes={editingIncident?.minutes || 0}
        isReadOnly={isReadOnly}
        onClose={() => {
          setMinutesEditorOpen(false);
          setEditingIncident(null);
        }}
        onSave={handleSaveMinutes}
      />
    </div>
  );
}




"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Filter } from "lucide-react";
import { Drawer, useMediaQuery } from "@mui/material";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import {
  fetchStructureTree,
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
import ScopeBreadcrumb from "../../components/ScopeBreadcrumb";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
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

  const getScopeLabel = useCallback(() => {
    if (filters.scopeType === "SCHOOL") {
      return locale === "ar" ? t("scopeSchool") : "School";
    }

    if (filters.scopeType === "STAGE") {
      const stage = stages.find((item) => item.id === filters.scopeIds?.stageId);
      return (locale === "ar" ? stage?.nameAr : stage?.nameEn) || "-";
    }

    if (filters.scopeType === "GRADE") {
      const grade = grades.find((item) => item.id === filters.scopeIds?.gradeId);
      return (locale === "ar" ? grade?.nameAr : grade?.nameEn) || "-";
    }

    const section = sections.find((item) => item.id === filters.scopeIds?.sectionId);
    return (locale === "ar" ? section?.nameAr : section?.nameEn) || "-";
  }, [filters, grades, locale, sections, stages, t]);

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
      scopeName: getScopeLabel(),
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

      {isReadOnly && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-800)", borderBottom: "1px solid var(--color-warning-200)" }}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{t("readonlyBanner")}</span>
        </div>
      )}
  {/* Scope Breadcrumb */}
          
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0" style={{ backgroundColor: "var(--background)" }}>
        {(
            
              <ScopeBreadcrumb
                scopeType={filters.scopeType}
                scopeIds={filters.scopeIds}
                stages={stages}
                grades={grades}
                sections={sections}
              />
           
          )}
        <LateEarlyKpisBar kpis={kpis} />

        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 min-h-0 flex-1">
            <div className="col-span-8 min-h-0 flex flex-col gap-4">
              <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
                <LateEarlyFiltersBar
                  filters={{ ...filters, search: searchInput }}
                  stages={stages}
                  grades={grades}
                  sections={sections}
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
              </div>

              <div className="rounded-xl border overflow-hidden min-h-0" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
                {loading ? (
                                    <div className="h-full flex items-center justify-center py-4"><PartialLoader/></div>
                  
                ) : (
                  <LateEarlyTable
                    incidents={incidents}
                    isReadOnly={isReadOnly}
                    onView={handleOpenIncident}
                    onEditMinutes={handleEditMinutes}
                  />
                )}
              </div>
            </div>

            <div className="col-span-4 min-h-0 rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
              <IncidentDetailsDrawer
                incident={selectedIncident}
                isReadOnly={isReadOnly}
                onClose={() => setSelectedIncident(null)}
                onEditMinutes={handleEditMinutes}
              />
            </div>
          </div>
        )}

        {isMobile && (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setFiltersDrawerOpen(true)}
            >
              {t("filters.filters")}
            </Button>

            <div className="rounded-xl border overflow-hidden min-h-0" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
              {loading ? (
                                 <div className="h-full flex items-center justify-center py-4"><PartialLoader/></div>
               
              ) : (
                <LateEarlyTable
                  incidents={incidents}
                  isReadOnly={isReadOnly}
                  onView={handleOpenIncident}
                  onEditMinutes={handleEditMinutes}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <LateEarlyFiltersDrawer
        isOpen={filtersDrawerOpen}
        filters={{ ...filters, search: searchInput }}
        stages={stages}
        grades={grades}
        sections={sections}
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

      <Drawer anchor="bottom" open={detailsDrawerOpen} onClose={() => setDetailsDrawerOpen(false)}>
        <div className="h-[80vh]">
          <IncidentDetailsDrawer
            incident={selectedIncident}
            isReadOnly={isReadOnly}
            onClose={() => setDetailsDrawerOpen(false)}
            onEditMinutes={handleEditMinutes}
          />
        </div>
      </Drawer>

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

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, Download } from "lucide-react";
import { Snackbar, Alert } from "@mui/material";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import CalendarToolbar from "../components/CalendarToolbar";
import MonthCalendar from "../components/MonthCalendar";
import WeekCalendar from "../components/WeekCalendar";
import AgendaView from "../components/AgendaView";
import EventDialog from "../components/EventDialog";
import MoveEventDialog from "../components/MoveEventDialog";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import {
  fetchTermEvents,
  updateEvent,
  AcademicEvent,
} from "@/features/academics/calendar/services/calendarService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

export default function AcademicCalendarPage() {
  const t = useTranslations("academics.calendar");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    academicYearId,
    termId,
    termStatus,
    isInitializing,
    selectedTerm,
  } = useAcademicYearTermLayoutContext();

  const queryState = useMemo(() => {
    const rawDate = searchParams.get("date");
    const parsedDate =
      rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? new Date(`${rawDate}T00:00:00`)
        : null;
    const validDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();

    const rawTypes = (searchParams.get("types") || "")
      .split(",")
      .filter(Boolean) as AcademicEvent["type"][];
    const validTypes = rawTypes.filter((type) =>
      ["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"].includes(type)
    ) as AcademicEvent["type"][];

    const rawScope = searchParams.get("scope");
    const validScope =
      rawScope &&
      ["ALL", "SCHOOL", "STAGE", "GRADE", "SECTION"].includes(rawScope)
        ? (rawScope as "ALL" | AcademicEvent["scopeType"])
        : "ALL";

    const rawView = searchParams.get("view");
    const validView =
      rawView && ["month", "week", "agenda"].includes(rawView)
        ? (rawView as "month" | "week" | "agenda")
        : "month";

    const rawMode = searchParams.get("mode");
    const validMode =
      rawMode && ["compact", "comfortable", "minimal"].includes(rawMode)
        ? (rawMode as "compact" | "comfortable" | "minimal")
        : "compact";

    return {
      currentDate: validDate,
      typeFilters:
        validTypes.length > 0
          ? validTypes
          : (["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"] as AcademicEvent["type"][]),
      scopeFilter: validScope,
      view: validView,
      displayMode: validMode,
    };
  }, [searchParams]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(queryState.currentDate);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View and display mode state
  const [view, setView] = useState<"month" | "week" | "agenda">(queryState.view);
  const [displayMode, setDisplayMode] = useState<"compact" | "comfortable" | "minimal">(queryState.displayMode);

  // Filters
  const [typeFilters, setTypeFilters] = useState<AcademicEvent["type"][]>(queryState.typeFilters);
  const [scopeFilter, setScopeFilter] = useState<"ALL" | AcademicEvent["scopeType"]>(queryState.scopeFilter);

  // Dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  
  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingEvent, setMovingEvent] = useState<AcademicEvent | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const isReadOnly = termStatus === "closed";
  const term = selectedTerm;

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: term?.name || termId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "title", label: locale === "ar" ? "العنوان" : "Title" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "scope", label: locale === "ar" ? "النطاق" : "Scope" },
      { key: "allDay", label: locale === "ar" ? "طوال اليوم" : "All day" },
      {
        key: "startDate",
        label: locale === "ar" ? "تاريخ البداية" : "Start date",
      },
      { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End date" },
      { key: "notes", label: locale === "ar" ? "ملاحظات" : "Notes" },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("academic-calendar", termId),
      format,
      columns,
      rows: filteredEvents.map((event) => ({
        title: locale === "ar" ? event.titleAr : event.titleEn,
        type: t(`event_types.${event.type.toLowerCase()}`),
        scope: t(`scopes.${event.scopeType.toLowerCase()}`),
        allDay: event.allDay ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
        startDate: event.startDate,
        endDate: event.endDate,
        notes:
          locale === "ar"
            ? event.notesAr || event.notesEn || ""
            : event.notesEn || event.notesAr || "",
      })),
      locale: format === "json" ? "en" : undefined,
      jsonData: {
        title: "Academic Calendar",
        metadata,
        filters: {
          scope: scopeFilter,
          view,
          displayMode,
          typeFilters,
          currentDate: currentDate.toISOString(),
        },
        events: filteredEvents.map((event) => ({
          id: event.id,
          titleEn: event.titleEn,
          titleAr: event.titleAr,
          type: event.type,
          scopeType: event.scopeType,
          allDay: event.allDay,
          startDate: event.startDate,
          endDate: event.endDate,
          notesEn: event.notesEn || "",
          notesAr: event.notesAr || "",
        })),
      },
    });
  };

  // Load events when term changes
  useEffect(() => {
    if (isInitializing) return;
    if (!termId) {
      setIsLoading(false);
      return;
    }
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, termId]);

  // Apply filters when events or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, typeFilters, scopeFilter]);

  useEffect(() => {
    setCurrentDate(queryState.currentDate);
  }, [queryState.currentDate]);

  useEffect(() => {
    setTypeFilters(queryState.typeFilters);
  }, [queryState.typeFilters]);

  useEffect(() => {
    setScopeFilter(queryState.scopeFilter);
  }, [queryState.scopeFilter]);

  useEffect(() => {
    setView(queryState.view);
  }, [queryState.view]);

  useEffect(() => {
    setDisplayMode(queryState.displayMode);
  }, [queryState.displayMode]);

  const loadEvents = async () => {
    if (!termId) return;
    setIsLoading(true);
    try {
      const termEvents = await fetchTermEvents(termId);
      setEvents(termEvents);
      
      // Apply filters immediately after setting events
      let filtered = termEvents;
      filtered = filtered.filter((event) => typeFilters.includes(event.type));
      if (scopeFilter !== "ALL") {
        filtered = filtered.filter((event) => event.scopeType === scopeFilter);
      }
      setFilteredEvents(filtered);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = events;

    // Filter by type
    filtered = filtered.filter((event) => typeFilters.includes(event.type));

    // Filter by scope
    if (scopeFilter !== "ALL") {
      filtered = filtered.filter((event) => event.scopeType === scopeFilter);
    }

    setFilteredEvents(filtered);
  };

  const updateURL = useCallback(
    (
      yearId: string,
      tId: string,
      state: {
        currentDate?: Date;
        currentView?: "month" | "week" | "agenda";
        currentMode?: "compact" | "comfortable" | "minimal";
        currentTypeFilters?: AcademicEvent["type"][];
        currentScopeFilter?: "ALL" | AcademicEvent["scopeType"];
      },
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      const nextDate = state.currentDate ?? currentDate;
      const formattedDate = [
        nextDate.getFullYear(),
        String(nextDate.getMonth() + 1).padStart(2, "0"),
        String(nextDate.getDate()).padStart(2, "0"),
      ].join("-");
      params.set("date", formattedDate);

      const nextView = state.currentView ?? view;
      const nextMode = state.currentMode ?? displayMode;
      const nextTypes = state.currentTypeFilters ?? typeFilters;
      const nextScope = state.currentScopeFilter ?? scopeFilter;

      params.set("view", nextView);
      params.set("mode", nextMode);

      if (nextTypes.length > 0 && nextTypes.length < 4) {
        params.set("types", nextTypes.join(","));
      }

      if (nextScope !== "ALL") {
        params.set("scope", nextScope);
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = `?${nextQuery}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [currentDate, displayMode, router, scopeFilter, searchParams, typeFilters, view]
  );

  const handleViewChange = (newView: "month" | "week" | "agenda") => {
    setView(newView);
    updateURL(
      academicYearId,
      termId,
      {
        currentView: newView,
      },
      "push"
    );
  };

  const handleDisplayModeChange = (newMode: "compact" | "comfortable" | "minimal") => {
    setDisplayMode(newMode);
    updateURL(
      academicYearId,
      termId,
      {
        currentMode: newMode,
      },
      "push"
    );
  };

  const handleDateChange = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      updateURL(
        academicYearId,
        termId,
        {
          currentDate: date,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleTypeFiltersChange = useCallback(
    (filters: AcademicEvent["type"][]) => {
      setTypeFilters(filters);
      updateURL(
        academicYearId,
        termId,
        {
          currentTypeFilters: filters,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleScopeFilterChange = useCallback(
    (scope: "ALL" | AcademicEvent["scopeType"]) => {
      setScopeFilter(scope);
      updateURL(
        academicYearId,
        termId,
        {
          currentScopeFilter: scope,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleAddEvent = (date?: Date) => {
    setEditingEvent(null);
    setPrefilledDate(date || null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: AcademicEvent) => {
    setEditingEvent(event);
    setPrefilledDate(null);
    setShowEventDialog(true);
  };

  const handleEventSuccess = async () => {
    await loadEvents();
    setShowEventDialog(false);
    setEditingEvent(null);
    setPrefilledDate(null);
  };

  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setEditingEvent(null);
    setPrefilledDate(null);
  };

  const handleEventMove = async (
    eventId: string,
    newStartDate: string,
    newEndDate: string
  ) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Optimistic update
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, startDate: newStartDate, endDate: newEndDate } : e
    );
    setEvents(updatedEvents);
    
    // Apply filters to updated events
    let filtered = updatedEvents;
    filtered = filtered.filter((event) => typeFilters.includes(event.type));
    if (scopeFilter !== "ALL") {
      filtered = filtered.filter((event) => event.scopeType === scopeFilter);
    }
    setFilteredEvents(filtered);

    try {
      await updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate,
      });

      setSnackbar({
        open: true,
        message: t("eventMoved"),
        severity: "success",
      });
    } catch (error) {
      // Rollback on failure
      await loadEvents();

      if (error instanceof Error && error.message === "DROP_OUTSIDE_TERM") {
        setSnackbar({
          open: true,
          message: t("dropOutsideTerm"),
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: t("moveFailed"),
          severity: "error",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner")}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-4 md:p-6">
          <div className="mb-4 flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {tExport("button")}
            </Button>
          </div>

          {/* Calendar Toolbar */}
          <CalendarToolbar
            currentDate={currentDate}
            onDateChange={handleDateChange}
            typeFilters={typeFilters}
            onTypeFiltersChange={handleTypeFiltersChange}
            scopeFilter={scopeFilter}
            onScopeFilterChange={handleScopeFilterChange}
            onAddEvent={() => handleAddEvent()}
            isReadOnly={isReadOnly}
            view={view}
            onViewChange={handleViewChange}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
            termStartDate={term?.startDate ? new Date(term.startDate) : undefined}
            termEndDate={term?.endDate ? new Date(term.endDate) : undefined}
          />

          {/* Calendar Views */}
          {term && view === "month" && (
            <MonthCalendar
              currentDate={currentDate}
              events={filteredEvents}
              onDateClick={handleAddEvent}
              onEventClick={handleEditEvent}
              isReadOnly={isReadOnly}
              term={term}
              onEventMove={handleEventMove}
              displayMode={displayMode}
            />
          )}

          {term && view === "week" && (
            <WeekCalendar
              currentDate={currentDate}
              events={filteredEvents}
              onDateClick={handleAddEvent}
              onEventClick={handleEditEvent}
              isReadOnly={isReadOnly}
              term={term}
              onEventMove={handleEventMove}
              displayMode={displayMode}
            />
          )}

          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={handleEditEvent}
            />
          )}
        </div>
      </div>

      {/* Event Dialog */}
      {term && (
        <EventDialog
          isOpen={showEventDialog}
          onClose={handleCloseDialog}
          onSuccess={handleEventSuccess}
          event={editingEvent}
          term={term}
          prefilledDate={prefilledDate}
          isReadOnly={isReadOnly && !!editingEvent}
        />
      )}

      {/* Move Event Dialog (Mobile Fallback) */}
      {term && (
        <MoveEventDialog
          isOpen={moveDialogOpen}
          onClose={() => {
            setMoveDialogOpen(false);
            setMovingEvent(null);
          }}
          event={movingEvent}
          term={term}
          onMove={async (newStartDate, newEndDate) => {
            if (movingEvent) {
              await handleEventMove(movingEvent.id, newStartDate, newEndDate);
              setMoveDialogOpen(false);
              setMovingEvent(null);
            }
          }}
        />
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={filteredEvents.length}
      />
    </div>
  );
}

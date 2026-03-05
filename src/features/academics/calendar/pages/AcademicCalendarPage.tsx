"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Snackbar, Alert } from "@mui/material";
import ContextBar from "../../components/shared/ContextBar";
import CalendarToolbar from "../components/CalendarToolbar";
import MonthCalendar from "../components/MonthCalendar";
import WeekCalendar from "../components/WeekCalendar";
import AgendaView from "../components/AgendaView";
import EventDialog from "../components/EventDialog";
import MoveEventDialog from "../components/MoveEventDialog";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchTermEvents,
  updateEvent,
  AcademicEvent,
} from "@/features/academics/calendar/services/calendarService";

export default function AcademicCalendarPage() {
  const t = useTranslations("academics.calendar");
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [term, setTerm] = useState<Term | null>(null);

  // Context data
  const [terms, setTerms] = useState<Term[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View and display mode state
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [displayMode, setDisplayMode] = useState<"compact" | "comfortable" | "minimal">("compact");

  // Filters
  const [typeFilters, setTypeFilters] = useState<AcademicEvent["type"][]>([
    "HOLIDAY",
    "EXAM",
    "ACTIVITY",
    "OTHER",
  ]);
  const [scopeFilter, setScopeFilter] = useState<"ALL" | AcademicEvent["scopeType"]>("ALL");

  // Dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  
  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingEvent, setMovingEvent] = useState<AcademicEvent | null>(null);
  
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

  // Initialize from URL
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);
          setTerm(selectedTerm);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load events when term changes
  useEffect(() => {
    if (!termId) return;
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);

  // Apply filters when events or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, typeFilters, scopeFilter]);

  const loadEvents = async () => {
    if (!termId) return;
    console.log("loadEvents called for termId:", termId);
    try {
      const termEvents = await fetchTermEvents(termId);
      console.log("Loaded events:", termEvents.length, termEvents);
      setEvents(termEvents);
      
      // Apply filters immediately after setting events
      let filtered = termEvents;
      filtered = filtered.filter((event) => typeFilters.includes(event.type));
      if (scopeFilter !== "ALL") {
        filtered = filtered.filter((event) => event.scopeType === scopeFilter);
      }
      console.log("Applied filters immediately:", filtered.length, "events");
      setFilteredEvents(filtered);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const applyFilters = () => {
    let filtered = events;

    console.log("applyFilters called with", events.length, "events");

    // Filter by type
    filtered = filtered.filter((event) => typeFilters.includes(event.type));

    // Filter by scope
    if (scopeFilter !== "ALL") {
      filtered = filtered.filter((event) => event.scopeType === scopeFilter);
    }

    console.log("After filtering:", filtered.length, "events");
    setFilteredEvents(filtered);
  };

  const updateURL = useCallback(
    (yearId: string, tId: string, currentView?: string, currentMode?: string) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      if (currentView) params.set("view", currentView);
      if (currentMode) params.set("mode", currentMode);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Initialize view and mode from URL
  useEffect(() => {
    const urlView = searchParams.get("view") as "month" | "week" | "agenda" | null;
    const urlMode = searchParams.get("mode") as "compact" | "comfortable" | "minimal" | null;
    
    if (urlView && ["month", "week", "agenda"].includes(urlView)) {
      setView(urlView);
    }
    if (urlMode && ["compact", "comfortable", "minimal"].includes(urlMode)) {
      setDisplayMode(urlMode);
    }
  }, [searchParams]);

  const handleAcademicYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      setTerm(defaultTerm);
      updateURL(yearId, defaultTerm.id, view, displayMode);
    }
  };

  const handleTermChange = (tId: string) => {
    const selectedTerm = terms.find((t) => t.id === tId);
    if (selectedTerm) {
      setTermId(tId);
      setTermStatus(selectedTerm.status);
      setTerm(selectedTerm);
      updateURL(academicYearId, tId, view, displayMode);
    }
  };

  const handleViewChange = (newView: "month" | "week" | "agenda") => {
    setView(newView);
    updateURL(academicYearId, termId, newView, displayMode);
  };

  const handleDisplayModeChange = (newMode: "compact" | "comfortable" | "minimal") => {
    setDisplayMode(newMode);
    updateURL(academicYearId, termId, view, newMode);
  };

  const handlePromoteCarryOver = () => {
    // Not applicable for calendar
  };

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
    console.log("handleEventSuccess called, reloading events...");
    await loadEvents();
    console.log("Events reloaded, closing dialog");
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        onPromoteCarryOver={handlePromoteCarryOver}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

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
          {/* Calendar Toolbar */}
          <CalendarToolbar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            typeFilters={typeFilters}
            onTypeFiltersChange={setTypeFilters}
            scopeFilter={scopeFilter}
            onScopeFilterChange={setScopeFilter}
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
    </div>
  );
}

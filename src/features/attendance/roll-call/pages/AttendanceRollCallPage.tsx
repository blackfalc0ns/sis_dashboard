"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Filter } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import ScopeBreadcrumb from "@/features/attendance/shared/components/ScopeBreadcrumb";
import AttendanceReadOnlyBanner from "@/features/attendance/shared/components/AttendanceReadOnlyBanner";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import SessionPickerPanel from "../components/SessionPickerPanel";
import RosterFiltersBar, { type RosterFilters } from "../components/RosterFiltersBar";
import RollCallFiltersDrawer from "../components/RollCallFiltersDrawer";
import RollCallHeaderBar from "../components/RollCallHeaderBar";
import AttendanceKpisBar from "../components/AttendanceKpisBar";
import RosterTable from "../components/RosterTable";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchEffectivePolicy,
  fetchRoster,
  getOrCreateSession,
  saveSession,
  submitSession,
  unsubmitSession,
} from "../services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { exportAttendanceSession } from "../utils/attendanceExport";
import { computeAttendanceKpis } from "../utils/attendanceKpis";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { isScopeSelectionComplete, type AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type {
  AttendanceSession,
  AttendanceEntry,
  RosterStudent,
  AttendanceStatus,
} from "../types";
import MainLoader from "@/components/ui/loaders/MainLoader";

export default function AttendanceRollCallPage() {
  const t = useTranslations("attendance.rollCall");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceTermContext();

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Session picker state
  const [scopeType, setScopeType] = useState<AttendanceScopeType>("SECTION");
  const [scopeIds, setScopeIds] = useState<AttendanceScopeIds>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Policy & timetable
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [periods, setPeriods] = useState<import("@/features/academics/timetable/types/timetableConfig").TimetablePeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  // Session & roster
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<AttendanceEntry[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showUnsubmitConfirm, setShowUnsubmitConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const { values, setValues, reset } = useUrlQueryState<{
    search: string;
    status: string;
    excuseCompleteness: string;
    lateMin: string;
    earlyLeaveMin: string;
  }>({
    defaults: {
      search: "",
      status: "ALL",
      excuseCompleteness: "ALL",
      lateMin: "",
      earlyLeaveMin: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: (current) => {
      const nextUpdates: Partial<
        Record<
          keyof typeof current,
          string | null
        >
      > = {};
      const validStatuses = [
        "ALL",
        "UNMARKED",
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED",
        "EARLY_LEAVE",
      ] satisfies Array<"ALL" | "UNMARKED" | AttendanceStatus>;
      const validExcuseCompleteness = ["ALL", "COMPLETE", "MISSING"];

      if (!validStatuses.includes(current.status as (typeof validStatuses)[number])) {
        nextUpdates.status = null;
      }

      if (!validExcuseCompleteness.includes(current.excuseCompleteness)) {
        nextUpdates.excuseCompleteness = null;
      }

      const lateMin = current.lateMin.trim();
      if (lateMin && (!/^\d+$/.test(lateMin) || Number(lateMin) < 0)) {
        nextUpdates.lateMin = null;
      }

      const earlyLeaveMin = current.earlyLeaveMin.trim();
      if (
        earlyLeaveMin &&
        (!/^\d+$/.test(earlyLeaveMin) || Number(earlyLeaveMin) < 0)
      ) {
        nextUpdates.earlyLeaveMin = null;
      }

      return Object.keys(nextUpdates).length > 0 ? nextUpdates : null;
    },
  });

  const filters = useMemo<RosterFilters>(() => {
    const parseMinutes = (value: string) => {
      if (!value) {
        return undefined;
      }

      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    return {
      search: values.search,
      status: values.status as RosterFilters["status"],
      excuseCompleteness:
        values.excuseCompleteness as RosterFilters["excuseCompleteness"],
      lateMin: parseMinutes(values.lateMin),
      earlyLeaveMin: parseMinutes(values.earlyLeaveMin),
    };
  }, [values]);

  const setFilters = useCallback(
    (nextFilters: RosterFilters) => {
      const onlySearchChanged =
        nextFilters.search !== filters.search &&
        nextFilters.status === filters.status &&
        nextFilters.excuseCompleteness === filters.excuseCompleteness &&
        nextFilters.lateMin === filters.lateMin &&
        nextFilters.earlyLeaveMin === filters.earlyLeaveMin;

      setValues(
        {
          search: nextFilters.search || null,
          status: nextFilters.status,
          excuseCompleteness: nextFilters.excuseCompleteness || "ALL",
          lateMin:
            nextFilters.lateMin !== undefined
              ? String(nextFilters.lateMin)
              : null,
          earlyLeaveMin:
            nextFilters.earlyLeaveMin !== undefined
              ? String(nextFilters.earlyLeaveMin)
              : null,
        },
        onlySearchChanged ? "replace" : "push",
      );
    },
    [filters, setValues],
  );

  const isReadOnly = termContext.isReadOnly;
  const isDirty = JSON.stringify(entries) !== JSON.stringify(originalEntries);
  const isSubmitted = session?.status === "SUBMITTED";

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  // Compute KPIs
  const kpis = useMemo(() => {
    return computeAttendanceKpis(roster, entries);
  }, [roster, entries]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return roster.filter((student) => {
      const entry = entries.find((e) => e.studentId === student.id);

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const nameMatch =
          student.nameAr.toLowerCase().includes(query) ||
          student.nameEn.toLowerCase().includes(query) ||
          student.studentNumber.toLowerCase().includes(query);
        if (!nameMatch) return false;
      }

      // Status filter
      if (filters.status !== "ALL") {
        if (filters.status === "UNMARKED" && entry?.status) return false;
        if (filters.status !== "UNMARKED" && entry?.status !== filters.status) return false;
      }

      // Excuse completeness filter
      if (filters.excuseCompleteness && filters.excuseCompleteness !== "ALL") {
        if (entry?.status !== "EXCUSED") return false;
        const hasReason = !!entry.excuseReason;
        const hasAttachment = (entry.excuseAttachments?.length ?? 0) > 0;
        const isComplete =
          hasReason && (!policy?.requireAttachmentForExcuse || hasAttachment);

        if (filters.excuseCompleteness === "COMPLETE" && !isComplete) return false;
        if (filters.excuseCompleteness === "MISSING" && isComplete) return false;
      }

      // Late minutes filter
      if (filters.lateMin !== undefined) {
        if (entry?.status !== "LATE" || !entry.minutesLate || entry.minutesLate < filters.lateMin) {
          return false;
        }
      }

      // Early leave minutes filter
      if (filters.earlyLeaveMin !== undefined) {
        if (
          entry?.status !== "EARLY_LEAVE" ||
          !entry.minutesEarlyLeave ||
          entry.minutesEarlyLeave < filters.earlyLeaveMin
        ) {
          return false;
        }
      }

      return true;
    });
  }, [roster, entries, filters, policy]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "ALL" ||
    filters.excuseCompleteness !== "ALL" ||
    filters.lateMin !== undefined ||
    filters.earlyLeaveMin !== undefined;

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters, showFilters]);

  // Load structure tree
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(termContext.yearId!, termContext.termId!);
        setStages(tree.stages);
        setGrades(tree.grades);
        setSections(tree.sections);
        setClassrooms(tree.classrooms);
      } catch (error) {
        console.error("Failed to load structure:", error);
      }
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  // Load policy and timetable when scope/date changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId || !date) return;

    if (!isScopeSelectionComplete(scopeType, scopeIds)) return;

    const loadPolicyAndTimetable = async () => {
      try {
        // Fetch policy
        const effectivePolicy = await fetchEffectivePolicy(
          termContext.yearId!,
          termContext.termId!,
          scopeType,
          scopeIds,
          date
        );
        setPolicy(effectivePolicy);

        // Fetch timetable config if PERIOD mode
        if (effectivePolicy?.mode === "PERIOD") {
          const termConfig = await fetchTimetableConfig(termContext.termId!, "TERM");
          const gradeConfig =
            scopeIds.gradeId
              ? await fetchTimetableConfig(termContext.termId!, "GRADE", scopeIds.gradeId)
              : null;
          const sectionConfig =
            scopeIds.sectionId
              ? await fetchTimetableConfig(termContext.termId!, "SECTION", scopeIds.sectionId)
              : null;

          const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
          setPeriods(resolved.periods);

          // Auto-select first period if none selected
          if (!selectedPeriodId && resolved.periods.length > 0) {
            setSelectedPeriodId(resolved.periods[0].id);
          }
        } else {
          setPeriods([]);
          setSelectedPeriodId(null);
        }
      } catch (error) {
        console.error("Failed to load policy/timetable:", error);
      }
    };

    loadPolicyAndTimetable();
  }, [termContext.yearId, termContext.termId, scopeType, scopeIds, date, selectedPeriodId]);

  // Load session and roster
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId || !date || !policy) return;

    if (!isScopeSelectionComplete(scopeType, scopeIds)) return;

    // For PERIOD mode, need period selection
    if (policy.mode === "PERIOD" && !selectedPeriodId) return;

    const loadSessionAndRoster = async () => {
      try {
        setIsLoading(true);

        // Fetch roster
        const rosterData = await fetchRoster(scopeType, scopeIds);
        setRoster(rosterData);

        // Get or create session
        const periodData = periods.find((p) => p.id === selectedPeriodId);
        const sessionData = await getOrCreateSession({
          yearId: termContext.yearId!,
          termId: termContext.termId!,
          date,
          scopeType,
          scopeIds,
          mode: policy.mode,
          periodId: selectedPeriodId || undefined,
          periodIndex: periodData?.index,
          periodNameAr: periodData?.nameAr,
          periodNameEn: periodData?.nameEn,
        });

        setSession(sessionData.session);
        setEntries(sessionData.entries);
        setOriginalEntries(JSON.parse(JSON.stringify(sessionData.entries)));
      } catch (error) {
        console.error("Failed to load session/roster:", error);
        showError(tCommon("error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionAndRoster();
  }, [termContext.yearId, termContext.termId, date, scopeType, scopeIds, policy, selectedPeriodId, periods, showError, tCommon]);

  // Handle entry change
  const handleEntryChange = useCallback(
    (studentId: string, updates: Partial<AttendanceEntry>) => {
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.studentId === studentId);

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        } else {
          // Create new
          const newEntry: AttendanceEntry = {
            id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            sessionId: session?.id || "",
            studentId,
            status: updates.status || "PRESENT",
            minutesLate: updates.minutesLate,
            minutesEarlyLeave: updates.minutesEarlyLeave,
            note: updates.note,
            updatedAt: new Date().toISOString(),
          };
          return [...prev, newEntry];
        }
      });
    },
    [session]
  );

  // Save
  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      setIsSaving(true);
      await saveSession(session, entries);
      setOriginalEntries(JSON.parse(JSON.stringify(entries)));
      showSuccess(t("messages.saved"));
    } catch (error) {
      console.error("Failed to save:", error);
      showError(tCommon("error_saving"));
    } finally {
      setIsSaving(false);
    }
  }, [session, entries, t, tCommon, showSuccess, showError]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!session || !policy) return;

    // Validate entries
    const validationErrors: string[] = [];
    
    entries.forEach((entry) => {
      const student = roster.find((s) => s.id === entry.studentId);
      const studentName = locale === "ar" ? student?.nameAr : student?.nameEn;

      // Check EXCUSED entries
      if (entry.status === "EXCUSED") {
        if (!entry.excuseReason) {
          validationErrors.push(
            `${studentName}: ${t("excuse.requiredReason")}`
          );
        }
        if (policy.requireAttachmentForExcuse && (!entry.excuseAttachments || entry.excuseAttachments.length === 0)) {
          validationErrors.push(
            `${studentName}: ${t("excuse.requiredAttachment")}`
          );
        }
      }

      // Check EARLY_LEAVE entries
      if (entry.status === "EARLY_LEAVE") {
        if (!entry.minutesEarlyLeave || entry.minutesEarlyLeave < 1) {
          validationErrors.push(
            `${studentName}: ${t("earlyLeave.required")}`
          );
        }
      }
    });

    if (validationErrors.length > 0) {
      showError(validationErrors.join("\n"));
      return;
    }

    // Check completion
    if (kpis.unmarkedCount > 0) {
      const confirmed = window.confirm(
        t("messages.submitIncomplete", { count: kpis.unmarkedCount })
      );
      if (!confirmed) return;
    }

    try {
      setIsSaving(true);
      // Save first
      await saveSession(session, entries);
      // Then submit
      const submitted = await submitSession(session.id, termContext.yearId!, termContext.termId!);
      setSession(submitted);
      setOriginalEntries(JSON.parse(JSON.stringify(entries)));
      showSuccess(t("messages.submitted"));
    } catch (error) {
      console.error("Failed to submit:", error);
      showError(tCommon("error_saving"));
    } finally {
      setIsSaving(false);
    }
  }, [session, policy, entries, kpis, roster, termContext.yearId, termContext.termId, locale, t, tCommon, showSuccess, showError]);

  // Unsubmit
  const handleUnsubmit = useCallback(async () => {
    if (!session) return;

    try {
      setIsSaving(true);
      const unsubmitted = await unsubmitSession(termContext.yearId!, termContext.termId!, session.id);
      setSession(unsubmitted);
      showSuccess(t("messages.unsubmittedSuccess"));
    } catch (error) {
      console.error("Failed to unsubmit:", error);
      showError(tCommon("error_saving"));
    } finally {
      setIsSaving(false);
    }
  }, [session, termContext.yearId, termContext.termId, t, tCommon, showSuccess, showError]);

  const handleUnsubmitConfirm = useCallback(() => {
    setShowUnsubmitConfirm(false);
    handleUnsubmit();
  }, [handleUnsubmit]);

    // Reset
  const handleReset = useCallback(() => {
    setEntries(JSON.parse(JSON.stringify(originalEntries)));
  }, [originalEntries]);

  // Export
  const handleExport = useCallback(() => {
    if (!session) return;

    const scopeName = getAttendanceScopeLabel({
      scopeType,
      scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
    });
    exportAttendanceSession({
      session,
      entries,
      roster,
      locale,
      scopeName,
    });
  }, [classrooms, entries, grades, locale, roster, scopeIds, scopeType, sections, session, stages]);

  // Bulk actions
  const handleMarkAllPresent = useCallback(() => {
    roster.forEach((student) => {
      handleEntryChange(student.id, { status: "PRESENT" });
    });
  }, [roster, handleEntryChange]);

  const handleClearAll = useCallback(() => {
    setEntries([]);
  }, []);

  // Unsaved changes guard
  const checkUnsavedChanges = useCallback(
    (action: () => void) => {
      if (isDirty && !isReadOnly && !isSubmitted) {
        setPendingAction(() => action);
        setShowDiscardDialog(true);
      } else {
        action();
      }
    },
    [isDirty, isReadOnly, isSubmitted]
  );

  const handleDiscardConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowDiscardDialog(false);
  }, [pendingAction]);

  // Wrapped handlers with unsaved check
  const handleScopeTypeChange = useCallback(
    (newScopeType: AttendanceScopeType) => {
      checkUnsavedChanges(() => setScopeType(newScopeType));
    },
    [checkUnsavedChanges]
  );

  const handleScopeIdsChange = useCallback(
    (newScopeIds: AttendanceScopeIds) => {
      checkUnsavedChanges(() => setScopeIds(newScopeIds));
    },
    [checkUnsavedChanges]
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      checkUnsavedChanges(() => setDate(newDate));
    },
    [checkUnsavedChanges]
  );

  const handlePeriodChange = useCallback(
    (periodId: string) => {
      checkUnsavedChanges(() => setSelectedPeriodId(periodId));
    },
    [checkUnsavedChanges]
  );

  const handleResetFilters = () => {
    reset(undefined, "replace");
  };

  if (isLoading && !term) {
    return (
      <MainLoader />
    );
  }

  // Empty states
  const showNoPolicy = !policy && !isLoading;
  const showNoTimetable = policy?.mode === "PERIOD" && periods.length === 0 && !isLoading;
  const showNoRoster = roster.length === 0 && !isLoading && policy;

  return (
    <div className="flex flex-col h-screen">
      {/* Context Bar */}
      <ContextBar
        academicYearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termStatus={termContext.termStatus || "open"}
        onAcademicYearChange={termContext.setYearId}
        onTermChange={termContext.setTermId}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {/* Read-only Banner */}
      {isReadOnly && (
        <AttendanceReadOnlyBanner message={t("readonly_banner")} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Left Panel - Hidden on mobile */}
        <div className="hidden md:flex">
          <SessionPickerPanel
            scopeType={scopeType}
            scopeIds={scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onScopeTypeChange={handleScopeTypeChange}
            onScopeIdsChange={handleScopeIdsChange}
            date={date}
            onDateChange={handleDateChange}
            termStartDate={term?.startDate || ""}
            termEndDate={term?.endDate || ""}
            mode={policy?.mode || "DAILY"}
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={handlePeriodChange}
            sessionStatus={session?.status || null}
            disabled={isReadOnly || isSubmitted}
          />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Actions */}
          {session && roster.length > 0 && (
            <RollCallHeaderBar
              isDirty={isDirty}
              isReadOnly={isReadOnly}
              isSubmitted={isSubmitted}
              canSubmit={!isReadOnly && !isSubmitted}
              termStatus={termContext.termStatus || "open"}
              onSave={handleSave}
              onSubmit={handleSubmit}
              onUnsubmit={() => setShowUnsubmitConfirm(true)}
              onReset={handleReset}
              onExport={handleExport}
              onMarkAllPresent={handleMarkAllPresent}
              onClearAll={handleClearAll}
              isSaving={isSaving}
            />
          )}
    {/* Scope Breadcrumb */}
          {session && roster.length > 0 && (
            <div className="px-4 py-2">
              <ScopeBreadcrumb
                scopeType={scopeType}
                scopeIds={scopeIds}
                stages={stages}
                grades={grades}
                sections={sections}
                classrooms={classrooms}
              />
            </div>
          )}
          {/* KPIs Bar */}
          {session && roster.length > 0 && <AttendanceKpisBar kpis={kpis} />}

          {/* Filters Bar - Desktop */}
          {session && roster.length > 0 && !isMobile && (
            <RosterFiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              policy={policy}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
          )}

          {/* Filters Button - Mobile */}
          {session && roster.length > 0 && isMobile && (
            <div style={{ backgroundColor: "var(--background)", borderBottom: "1px solid var(--color-border)" }} className="px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersDrawer(true)}
                leftIcon={<Filter className="w-4 h-4" />}
                className="w-full"
              >
                {t("filters.openFilters")}
              </Button>
            </div>
          )}

          {/* Roster Table or Empty States */}
          {showNoPolicy && (
            <div className="flex-1 p-8">
              <AttendanceStatePanel
                title={t("empty.noPolicy")}
                description={t("empty.noPolicyDesc")}
              />
            </div>
          )}

          {showNoTimetable && (
            <div className="flex-1 p-8">
              <AttendanceStatePanel
                title={t("empty.noTimetable")}
                description={t("empty.noTimetableDesc")}
              />
            </div>
          )}

          {showNoRoster && (
            <div className="flex-1 p-8">
              <AttendanceStatePanel
                title={t("empty.noStudents")}
                description={t("empty.noStudentsDesc")}
              />
            </div>
          )}

          {session && roster.length > 0 && !showNoPolicy && !showNoTimetable && (
            <RosterTable
              roster={filteredRoster}
              entries={entries}
              policy={policy}
              onEntryChange={handleEntryChange}
              isReadOnly={isReadOnly || isSubmitted}
              searchQuery={filters.search}
            />
          )}
        </div>
      </div>

      {/* Filters Drawer - Mobile */}
      <RollCallFiltersDrawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        filters={filters}
        onFiltersChange={setFilters}
        policy={policy}
        onApply={() => setShowFiltersDrawer(false)}
        onReset={handleResetFilters}
      />

      {/* Discard Changes Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
        title={t("confirm.discardChangesTitle")}
        description={t("confirm.discardChangesMessage")}
        confirmLabel={tCommon("discard")}
        cancelLabel={tCommon("stay")}
        severity="warning"
      />

      {/* Unsubmit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnsubmitConfirm}
        onClose={() => setShowUnsubmitConfirm(false)}
        onConfirm={handleUnsubmitConfirm}
        title={t("confirm.unsubmitTitle")}
        description={t("confirm.unsubmitMessage")}
        confirmLabel={t("confirm.unsubmitConfirm")}
        cancelLabel={tCommon("cancel")}
        severity="warning"
      />
    </div>
  );
}






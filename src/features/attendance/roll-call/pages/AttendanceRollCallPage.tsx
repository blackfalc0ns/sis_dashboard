"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, Filter } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import ScopeBreadcrumb from "@/features/attendance/components/ScopeBreadcrumb";
import SessionPickerPanel from "../components/SessionPickerPanel";
import RosterFiltersBar, { type RosterFilters } from "../components/RosterFiltersBar";
import RollCallFiltersDrawer from "../components/RollCallFiltersDrawer";
import RollCallHeaderBar from "../components/RollCallHeaderBar";
import AttendanceKpisBar from "../components/AttendanceKpisBar";
import RosterTable from "../components/RosterTable";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  Term,
  Stage,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchEffectivePolicy,
  fetchRoster,
  getOrCreateSession,
  saveSession,
  submitSession,
} from "../services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { resolveTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import { exportAttendanceSession } from "../utils/attendanceExport";
import { computeAttendanceKpis } from "../utils/attendanceKpis";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type {
  AttendanceSession,
  AttendanceEntry,
  RosterStudent,
} from "../types";
import MainLoader from "@/components/ui/loaders/MainLoader";

export default function AttendanceRollCallPage() {
  const t = useTranslations("attendance.rollCall");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Context state
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [term, setTerm] = useState<Term | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Session picker state
  const [scopeType, setScopeType] = useState<AttendanceScopeType>("SECTION");
  const [scopeIds, setScopeIds] = useState<{
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
  }>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Policy & timetable
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [periods, setPeriods] = useState<import("@/features/academics/timetable/types/timetableConfig").TimetablePeriod[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);

  // Session & roster
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<AttendanceEntry[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [filters, setFilters] = useState<RosterFilters>({
    search: "",
    status: "ALL",
    excuseCompleteness: "ALL",
    lateMin: undefined,
    earlyLeaveMin: undefined,
  });

  const isReadOnly = termStatus === "closed";
  const isDirty = JSON.stringify(entries) !== JSON.stringify(originalEntries);
  const isSubmitted = session?.status === "SUBMITTED";

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
        showError(tCommon("error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
  }, []);

  // Load structure tree
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(academicYearId, termId);
        setStages(tree.stages);
        setGrades(tree.grades);
        setSections(tree.sections);
      } catch (error) {
        console.error("Failed to load structure:", error);
      }
    };

    loadStructure();
  }, [academicYearId, termId]);

  // Load policy and timetable when scope/date changes
  useEffect(() => {
    if (!academicYearId || !termId || !date) return;

    // Need at least a scope selection
    if (scopeType === "SECTION" && !scopeIds.sectionId) return;
    if (scopeType === "GRADE" && !scopeIds.gradeId) return;
    if (scopeType === "STAGE" && !scopeIds.stageId) return;

    const loadPolicyAndTimetable = async () => {
      try {
        // Fetch policy
        const effectivePolicy = await fetchEffectivePolicy(
          academicYearId,
          termId,
          scopeType,
          scopeIds,
          date
        );
        setPolicy(effectivePolicy);

        // Fetch timetable config if PERIOD mode
        if (effectivePolicy?.mode === "PERIOD") {
          const termConfig = await fetchTimetableConfig(termId, "TERM");
          const gradeConfig =
            scopeIds.gradeId
              ? await fetchTimetableConfig(termId, "GRADE", scopeIds.gradeId)
              : null;
          const sectionConfig =
            scopeIds.sectionId
              ? await fetchTimetableConfig(termId, "SECTION", scopeIds.sectionId)
              : null;

          const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
          setPeriods(resolved.periods);

          // Auto-select first period if none selected
          if (!selectedPeriodIndex && resolved.periods.length > 0) {
            setSelectedPeriodIndex(resolved.periods[0].index);
          }
        } else {
          setPeriods([]);
          setSelectedPeriodIndex(null);
        }
      } catch (error) {
        console.error("Failed to load policy/timetable:", error);
      }
    };

    loadPolicyAndTimetable();
  }, [academicYearId, termId, scopeType, scopeIds, date]);

  // Load session and roster
  useEffect(() => {
    if (!academicYearId || !termId || !date || !policy) return;

    // Need scope selection
    if (scopeType === "SECTION" && !scopeIds.sectionId) return;
    if (scopeType === "GRADE" && !scopeIds.gradeId) return;
    if (scopeType === "STAGE" && !scopeIds.stageId) return;

    // For PERIOD mode, need period selection
    if (policy.mode === "PERIOD" && !selectedPeriodIndex) return;

    const loadSessionAndRoster = async () => {
      try {
        setIsLoading(true);

        // Fetch roster
        const rosterData = await fetchRoster(scopeType, scopeIds);
        setRoster(rosterData);

        // Get or create session
        const periodData = periods.find((p) => p.index === selectedPeriodIndex);
        const sessionData = await getOrCreateSession({
          yearId: academicYearId,
          termId,
          date,
          scopeType,
          scopeIds,
          mode: policy.mode,
          periodIndex: selectedPeriodIndex || undefined,
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
  }, [academicYearId, termId, date, scopeType, scopeIds, policy, selectedPeriodIndex, periods]);

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
            id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      const submitted = await submitSession(session.id, academicYearId, termId);
      setSession(submitted);
      setOriginalEntries(JSON.parse(JSON.stringify(entries)));
      showSuccess(t("messages.submitted"));
    } catch (error) {
      console.error("Failed to submit:", error);
      showError(tCommon("error_saving"));
    } finally {
      setIsSaving(false);
    }
  }, [session, policy, entries, kpis, roster, academicYearId, termId, locale, t, tCommon, showSuccess, showError]);

  // Reset
  const handleReset = useCallback(() => {
    setEntries(JSON.parse(JSON.stringify(originalEntries)));
  }, [originalEntries]);

  // Export
  const handleExport = useCallback(() => {
    if (!session) return;

    const scopeName = getScopeName();
    exportAttendanceSession({
      session,
      entries,
      roster,
      locale,
      scopeName,
    });
  }, [session, entries, roster, locale]);

  // Bulk actions
  const handleMarkAllPresent = useCallback(() => {
    roster.forEach((student) => {
      handleEntryChange(student.id, { status: "PRESENT" });
    });
  }, [roster, handleEntryChange]);

  const handleClearAll = useCallback(() => {
    setEntries([]);
  }, []);

  // Get scope name for display
  const getScopeName = useCallback((): string => {
    if (scopeType === "SCHOOL") {
      return locale === "ar" ? "المدرسة" : "School";
    }
    if (scopeType === "STAGE" && scopeIds.stageId) {
      const stage = stages.find((s) => s.id === scopeIds.stageId);
      return locale === "ar" ? stage?.nameAr || "" : stage?.nameEn || "";
    }
    if (scopeType === "GRADE" && scopeIds.gradeId) {
      const grade = grades.find((g) => g.id === scopeIds.gradeId);
      return locale === "ar" ? grade?.nameAr || "" : grade?.nameEn || "";
    }
    if (scopeType === "SECTION" && scopeIds.sectionId) {
      const section = sections.find((s) => s.id === scopeIds.sectionId);
      return locale === "ar" ? section?.nameAr || "" : section?.nameEn || "";
    }
    return "";
  }, [scopeType, scopeIds, stages, grades, sections, locale]);

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
    (newScopeIds: { stageId?: string; gradeId?: string; sectionId?: string }) => {
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
    (periodIndex: number) => {
      checkUnsavedChanges(() => setSelectedPeriodIndex(periodIndex));
    },
    [checkUnsavedChanges]
  );

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "ALL",
      excuseCompleteness: "ALL",
      lateMin: undefined,
      earlyLeaveMin: undefined,
    });
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
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={setAcademicYearId}
        onTermChange={(newTermId) => {
          const newTerm = terms.find((t) => t.id === newTermId);
          if (newTerm) {
            setTermId(newTermId);
            setTermStatus(newTerm.status);
            setTerm(newTerm);
          }
        }}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {/* Read-only Banner */}
      {isReadOnly && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-800">{t("readonly_banner")}</span>
        </div>
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
            onScopeTypeChange={handleScopeTypeChange}
            onScopeIdsChange={handleScopeIdsChange}
            date={date}
            onDateChange={handleDateChange}
            termStartDate={term?.startDate || ""}
            termEndDate={term?.endDate || ""}
            mode={policy?.mode || "DAILY"}
            periods={periods}
            selectedPeriodIndex={selectedPeriodIndex}
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
              onSave={handleSave}
              onSubmit={handleSubmit}
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
            <div className="bg-white border-b border-gray-200 px-4 py-3">
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
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty.noPolicy")}</h3>
                <p className="text-sm text-gray-600">{t("empty.noPolicyDesc")}</p>
              </div>
            </div>
          )}

          {showNoTimetable && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("empty.noTimetable")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{t("empty.noTimetableDesc")}</p>
              </div>
            </div>
          )}

          {showNoRoster && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty.noStudents")}</h3>
                <p className="text-sm text-gray-600">{t("empty.noStudentsDesc")}</p>
              </div>
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
    </div>
  );
}

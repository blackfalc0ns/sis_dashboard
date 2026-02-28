"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle } from "lucide-react";
import FilterBar from "./FilterBar";
import TimetableGrid from "./TimetableGrid";
import ValidationPanel from "./ValidationPanel";
import EditSlotDialog from "./EditSlotDialog";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchStructureTree,
  Grade,
  Section,
} from "@/services/academics/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  Subject,
  SubjectAllocation,
} from "@/services/academics/subjectsService";
import {
  fetchTeachers,
  fetchTeacherAllocations,
  Teacher,
  TeacherAllocation,
} from "@/services/academics/teacherAllocationService";
import { fetchRooms } from "@/services/academics/roomsService";
import {
  fetchTimetable,
  fetchAllTimetablesForTerm,
  upsertTimetableEntries,
  publishTimetable,
  detectConflicts,
} from "@/services/academics/timetableService";
import {
  TimetableEntry,
  Room,
  TimetableConflict,
  SubjectHoursSummary,
} from "@/types/academics/timetable";

interface TimetableViewProps {
  termId: string;
  termStatus: "open" | "closed";
  isReadOnly: boolean;
  onDirtyChange: (dirty: boolean) => void;
  academicYearId?: string;
}

export default function TimetableView({
  termId,
  termStatus,
  isReadOnly,
  onDirtyChange,
  academicYearId = "",
}: TimetableViewProps) {
  const t = useTranslations("academics.timetable");
  const locale = useLocale();
  const { showToast } = useToast();

  // Data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [allTermEntries, setAllTermEntries] = useState<TimetableEntry[]>([]);

  // UI State
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validationPanelOpen, setValidationPanelOpen] = useState(true);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    day: number;
    period: number;
    entry?: TimetableEntry;
  } | null>(null);

  // Validation State
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [subjectHours, setSubjectHours] = useState<SubjectHoursSummary[]>([]);

  // Load initial data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, academicYearId]);

  // Load timetable when section changes
  useEffect(() => {
    if (selectedSectionId) {
      loadTimetable();
    }
  }, [selectedSectionId, termId]);

  // Update dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get the academic year ID - either from props or fetch the first one
      let yearId = academicYearId;
      
      if (!yearId) {
        const years = await fetchAcademicYears();
        const currentYear = years[0];
        if (!currentYear) {
          throw new Error("No academic year found");
        }
        yearId = currentYear.id;
      }

      const [structure, subjectsData, subjectAllocsData, teachersData, teacherAllocsData, roomsData] =
        await Promise.all([
          fetchStructureTree(yearId, termId),
          fetchSubjects(termId),
          fetchSubjectAllocations(termId),
          fetchTeachers(),
          fetchTeacherAllocations(termId),
          fetchRooms("school-1"),
        ]);

      // Extract grades and sections from structure
      const allGrades: Grade[] = structure.grades || [];
      const allSections: Section[] = structure.sections || [];

      setGrades(allGrades);
      setSections(allSections);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teachersData);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData.filter((r) => r.isActive));

      // Load all timetables for conflict detection
      const allEntries = await fetchAllTimetablesForTerm(termId);
      setAllTermEntries(allEntries);
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimetable = async () => {
    if (!selectedSectionId) return;

    try {
      const entries = await fetchTimetable(termId, selectedSectionId);
      setTimetableEntries(entries);
      setIsDirty(false);
      
      // Calculate validation
      calculateValidation(entries);
    } catch (error) {
      console.error("Failed to load timetable:", error);
      showToast("Failed to load timetable", "error");
    }
  };

  const calculateValidation = useCallback(
    (entries: TimetableEntry[]) => {
      // Calculate subject hours summary
      const selectedSection = sections.find((s) => s.id === selectedSectionId);
      if (!selectedSection) return;

      const selectedGrade = grades.find((g) => g.id === selectedSection.gradeId);
      if (!selectedGrade) return;

      const summary: SubjectHoursSummary[] = subjects.map((subject) => {
        // Get target hours from allocation
        const allocation = subjectAllocations.find(
          (a) => a.gradeId === selectedGrade.id && a.subjectId === subject.id
        );
        const target = allocation?.weeklyHours || 0;

        // Count actual hours from timetable
        const actual = entries.filter((e) => e.subjectId === subject.id).length;

        let status: "OK" | "UNDER" | "OVER" = "OK";
        if (actual < target) status = "UNDER";
        else if (actual > target) status = "OVER";

        return {
          subjectId: subject.id,
          subjectNameAr: subject.nameAr,
          subjectNameEn: subject.nameEn,
          target,
          actual,
          status,
        };
      });

      setSubjectHours(summary.filter((s) => s.target > 0));

      // Detect conflicts
      const detectedConflicts = detectConflicts(
        allTermEntries,
        sections,
        teachers,
        rooms,
        subjects
      );
      setConflicts(detectedConflicts);
    },
    [
      selectedSectionId,
      sections,
      grades,
      subjects,
      subjectAllocations,
      allTermEntries,
      teachers,
      rooms,
    ]
  );

  const handleSlotClick = (day: number, period: number) => {
    if (isReadOnly) return;

    const entry = timetableEntries.find((e) => e.day === day && e.period === period);
    setEditingSlot({ day, period, entry });
    setEditDialogOpen(true);
  };

  const handleSlotSave = async (
    day: number,
    period: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null
  ) => {
    // Update local state
    const updatedEntries = [...timetableEntries];
    const existingIndex = updatedEntries.findIndex(
      (e) => e.day === day && e.period === period
    );

    const newEntry: TimetableEntry = {
      id: existingIndex >= 0 ? updatedEntries[existingIndex].id : `temp-${Date.now()}`,
      termId,
      sectionId: selectedSectionId,
      day,
      period,
      subjectId,
      teacherId,
      roomId,
      status: "DRAFT",
    };

    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries.push(newEntry);
    }

    setTimetableEntries(updatedEntries);
    setIsDirty(true);
    setEditDialogOpen(false);
    
    // Recalculate validation
    calculateValidation(updatedEntries);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;

    setIsSaving(true);
    try {
      await upsertTimetableEntries(termId, selectedSectionId, timetableEntries);
      setIsDirty(false);
      showToast(t("actions.save") + " " + t("common.save_success", { ns: "common" }), "success");
      
      // Reload all entries for conflict detection
      const allEntries = await fetchAllTimetablesForTerm(termId);
      setAllTermEntries(allEntries);
      calculateValidation(timetableEntries);
    } catch (error) {
      console.error("Failed to save timetable:", error);
      showToast("Failed to save timetable", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSectionId) return;

    // Check for errors
    const hasConflicts = conflicts.some(
      (c) => c.sections.some((s) => s.sectionId === selectedSectionId)
    );
    const hasMismatches = subjectHours.some((s) => s.status !== "OK");

    if (hasConflicts || hasMismatches) {
      const confirmed = window.confirm(t("publish.withErrors"));
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(t("publish.confirmMessage"));
      if (!confirmed) return;
    }

    try {
      await publishTimetable(termId, selectedSectionId);
      showToast(t("publish.success"), "success");
      await loadTimetable();
    } catch (error) {
      console.error("Failed to publish timetable:", error);
      showToast(t("publish.error"), "error");
    }
  };

  const getDefaultTeacher = (subjectId: string): string | null => {
    if (!selectedSectionId) return null;
    
    const allocation = teacherAllocations.find(
      (a) => a.sectionId === selectedSectionId && a.subjectId === subjectId
    );
    return allocation?.teacherId || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("emptyState.noGrades.title")}
        </h3>
        <p className="text-gray-500 mb-4">{t("emptyState.noGrades.message")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <FilterBar
          grades={grades}
          sections={sections}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          onGradeChange={setSelectedGradeId}
          onSectionChange={setSelectedSectionId}
          locale={locale}
        />

        {/* Action Bar */}
        {selectedSectionId && (
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving || isReadOnly}
                variant="primary"
              >
                {isSaving ? t("actions.saving") : t("actions.save")}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isReadOnly}
                variant="secondary"
              >
                {t("actions.publish")}
              </Button>
            </div>
            {isDirty && (
              <span className="text-sm text-orange-600">
                {t("unsavedChanges.label")}
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedSectionId ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noSelection.title")}
              </h3>
              <p className="text-gray-500">{t("emptyState.noSelection.message")}</p>
            </div>
          ) : (
            <TimetableGrid
              entries={timetableEntries}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              conflicts={conflicts}
              onSlotClick={handleSlotClick}
              locale={locale}
              isReadOnly={isReadOnly}
            />
          )}
        </div>
      </div>

      {/* Validation Panel */}
      {validationPanelOpen && selectedSectionId && (
        <ValidationPanel
          subjectHours={subjectHours}
          conflicts={conflicts.filter((c) =>
            c.sections.some((s) => s.sectionId === selectedSectionId)
          )}
          totalSlots={5 * 8} // 5 days × 8 periods
          filledSlots={timetableEntries.filter((e) => e.subjectId).length}
          missingTeacher={timetableEntries.filter((e) => e.subjectId && !e.teacherId).length}
          missingRoom={timetableEntries.filter((e) => e.subjectId && !e.roomId).length}
          onClose={() => setValidationPanelOpen(false)}
          locale={locale}
        />
      )}

      {/* Edit Dialog */}
      {editDialogOpen && editingSlot && (
        <EditSlotDialog
          open={editDialogOpen}
          day={editingSlot.day}
          period={editingSlot.period}
          entry={editingSlot.entry}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          onSave={handleSlotSave}
          onClose={() => setEditDialogOpen(false)}
          getDefaultTeacher={getDefaultTeacher}
          locale={locale}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchStructureTree,
  updateStage,
  deleteStage,
  updateGrade,
  deleteGrade,
  updateSection,
  deleteSection,
  updateClassroom,
  deleteClassroom,
  reorderGrades,
  reorderSections,
  reorderClassrooms,
  carryOverStructure,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";

type StructureItemType = "stage" | "grade" | "section" | "classroom";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface UseAcademicStructureDataParams {
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
}

export function useAcademicStructureData({
  academicYearId,
  termId,
  isReadOnly,
}: UseAcademicStructureDataParams) {
  const t = useTranslations("academics.structure");
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const loadRequestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;

    if (!academicYearId || !termId) {
      if (requestId === loadRequestIdRef.current) {
        setStages([]);
        setGrades([]);
        setSections([]);
        setClassrooms([]);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStructureTree(academicYearId, termId);
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setStages(data.stages);
      setGrades(data.grades);
      setSections(data.sections);
      setClassrooms(data.classrooms);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setError("Failed to load data");
      console.error(err);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [academicYearId, termId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveItem = useCallback(
    async (
      type: StructureItemType,
      id: string | null,
      data: Partial<Stage | Grade | Section | Classroom>
    ) => {
      if (!id || isReadOnly) return;

      try {
        if (type === "stage") {
          const updated = await updateStage(academicYearId, termId, id, data);
          setStages((current) => current.map((item) => (item.id === id ? updated : item)));
          return;
        }

        if (type === "grade") {
          await updateGrade(academicYearId, termId, id, data);
        } else if (type === "section") {
          await updateSection(academicYearId, termId, id, data);
        } else {
          await updateClassroom(academicYearId, termId, id, data);
        }

        await loadData();
      } catch (err) {
        console.error("Failed to save:", err);
        throw err;
      }
    },
    [academicYearId, isReadOnly, loadData, termId]
  );

  const deleteItem = useCallback(
    async (type: StructureItemType, id: string) => {
      if (isReadOnly || !confirm(t("confirm_delete"))) {
        return false;
      }

      try {
        if (type === "stage") {
          await deleteStage(academicYearId, termId, id);
        } else if (type === "grade") {
          await deleteGrade(academicYearId, termId, id);
        } else if (type === "section") {
          await deleteSection(academicYearId, termId, id);
        } else {
          await deleteClassroom(academicYearId, termId, id);
        }

        await loadData();
        return true;
      } catch (err) {
        console.error("Failed to delete:", err);
        throw err;
      }
    },
    [academicYearId, isReadOnly, loadData, t, termId]
  );

  const reorderGrade = useCallback(
    async (gradeId: string, direction: "up" | "down") => {
      if (isReadOnly) return;

      const grade = grades.find((item) => item.id === gradeId);
      if (!grade) return;

      const stageGrades = grades
        .filter((item) => item.stageId === grade.stageId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = stageGrades.findIndex((item) => item.id === gradeId);

      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" && currentIndex === stageGrades.length - 1)
      ) {
        return;
      }

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const swapped = stageGrades[swapIndex];
      const nextGrades = grades.map((item) => {
        if (item.id === gradeId) {
          return { ...item, order: swapped.order };
        }
        if (item.id === swapped.id) {
          return { ...item, order: grade.order };
        }
        return item;
      });

      setGrades(nextGrades);

      try {
        const orderedIds = stageGrades.map((item) =>
          item.id === gradeId ? swapped.id : item.id === swapped.id ? gradeId : item.id
        );
        await reorderGrades(academicYearId, termId, grade.stageId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder:", err);
        setGrades(grades);
      }
    },
    [academicYearId, grades, isReadOnly, termId]
  );

  const dragReorderGrade = useCallback(
    async (stageId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly) return;

      const stageGrades = grades
        .filter((item) => item.stageId === stageId)
        .sort((a, b) => a.order - b.order);
      const reordered = [...stageGrades];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updated = grades.map((item) => {
        if (item.stageId !== stageId) return item;
        const nextOrder = reordered.findIndex((reorderedItem) => reorderedItem.id === item.id);
        return { ...item, order: nextOrder + 1 };
      });

      setGrades(updated);

      try {
        await reorderGrades(academicYearId, termId, stageId, reordered.map((item) => item.id));
        setSnackbar({ open: true, message: t("reorder_saved"), severity: "success" });
      } catch (err) {
        console.error("Failed to reorder:", err);
        setGrades(grades);
        setSnackbar({ open: true, message: t("reorder_failed"), severity: "error" });
      }
    },
    [academicYearId, grades, isReadOnly, t, termId]
  );

  const reorderSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (isReadOnly) return;

      const section = sections.find((item) => item.id === sectionId);
      if (!section) return;

      const gradeSections = sections
        .filter((item) => item.gradeId === section.gradeId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = gradeSections.findIndex((item) => item.id === sectionId);

      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" && currentIndex === gradeSections.length - 1)
      ) {
        return;
      }

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const swapped = gradeSections[swapIndex];
      const nextSections = sections.map((item) => {
        if (item.id === sectionId) {
          return { ...item, order: swapped.order };
        }
        if (item.id === swapped.id) {
          return { ...item, order: section.order };
        }
        return item;
      });

      setSections(nextSections);

      try {
        const orderedIds = gradeSections.map((item) =>
          item.id === sectionId ? swapped.id : item.id === swapped.id ? sectionId : item.id
        );
        await reorderSections(academicYearId, termId, section.gradeId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder sections:", err);
        setSections(sections);
      }
    },
    [academicYearId, isReadOnly, sections, termId]
  );

  const dragReorderSection = useCallback(
    async (gradeId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly) return;

      const gradeSections = sections
        .filter((item) => item.gradeId === gradeId)
        .sort((a, b) => a.order - b.order);
      const reordered = [...gradeSections];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updated = sections.map((item) => {
        if (item.gradeId !== gradeId) return item;
        const nextOrder = reordered.findIndex((reorderedItem) => reorderedItem.id === item.id);
        return { ...item, order: nextOrder + 1 };
      });

      setSections(updated);

      try {
        await reorderSections(academicYearId, termId, gradeId, reordered.map((item) => item.id));
        setSnackbar({ open: true, message: t("reorder_saved"), severity: "success" });
      } catch (err) {
        console.error("Failed to reorder sections:", err);
        setSections(sections);
        setSnackbar({ open: true, message: t("reorder_failed"), severity: "error" });
      }
    },
    [academicYearId, isReadOnly, sections, t, termId]
  );

  const reorderClassroom = useCallback(
    async (classroomId: string, direction: "up" | "down") => {
      if (isReadOnly) return;

      const classroom = classrooms.find((item) => item.id === classroomId);
      if (!classroom) return;

      const sectionClassrooms = classrooms
        .filter((item) => item.sectionId === classroom.sectionId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = sectionClassrooms.findIndex((item) => item.id === classroomId);

      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" && currentIndex === sectionClassrooms.length - 1)
      ) {
        return;
      }

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const swapped = sectionClassrooms[swapIndex];
      const nextClassrooms = classrooms.map((item) => {
        if (item.id === classroomId) {
          return { ...item, order: swapped.order };
        }
        if (item.id === swapped.id) {
          return { ...item, order: classroom.order };
        }
        return item;
      });

      setClassrooms(nextClassrooms);

      try {
        const orderedIds = sectionClassrooms.map((item) =>
          item.id === classroomId ? swapped.id : item.id === swapped.id ? classroomId : item.id
        );
        await reorderClassrooms(academicYearId, termId, classroom.sectionId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder classrooms:", err);
        setClassrooms(classrooms);
      }
    },
    [academicYearId, classrooms, isReadOnly, termId]
  );

  const dragReorderClassroom = useCallback(
    async (sectionId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly) return;

      const sectionClassrooms = classrooms
        .filter((item) => item.sectionId === sectionId)
        .sort((a, b) => a.order - b.order);
      const reordered = [...sectionClassrooms];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updated = classrooms.map((item) => {
        if (item.sectionId !== sectionId) return item;
        const nextOrder = reordered.findIndex((reorderedItem) => reorderedItem.id === item.id);
        return { ...item, order: nextOrder + 1 };
      });

      setClassrooms(updated);

      try {
        await reorderClassrooms(academicYearId, termId, sectionId, reordered.map((item) => item.id));
        setSnackbar({ open: true, message: t("reorder_saved"), severity: "success" });
      } catch (err) {
        console.error("Failed to reorder classrooms:", err);
        setClassrooms(classrooms);
        setSnackbar({ open: true, message: t("reorder_failed"), severity: "error" });
      }
    },
    [academicYearId, classrooms, isReadOnly, t, termId]
  );

  const carryOver = useCallback(
    async (options: {
      fromYearId: string;
      fromTermId: string;
      copyCapacities: boolean;
      copyOrdering: boolean;
    }) => {
      try {
        await carryOverStructure({
          ...options,
          toYearId: academicYearId,
          toTermId: termId,
        });

        setSnackbar({
          open: true,
          message: t("carry_over_dialog.success"),
          severity: "success",
        });
        await loadData();
        return true;
      } catch (err) {
        console.error("Failed to carry over:", err);
        setSnackbar({
          open: true,
          message: t("carry_over_dialog.error"),
          severity: "error",
        });
        return false;
      }
    },
    [academicYearId, loadData, t, termId]
  );

  return {
    stages,
    grades,
    sections,
    classrooms,
    isLoading,
    error,
    snackbar,
    hasNoStructure:
      stages.length === 0 &&
      grades.length === 0 &&
      sections.length === 0 &&
      classrooms.length === 0,
    setSnackbar,
    loadData,
    saveItem,
    deleteItem,
    reorderGrade,
    dragReorderGrade,
    reorderSection,
    dragReorderSection,
    reorderClassroom,
    dragReorderClassroom,
    carryOver,
  };
}

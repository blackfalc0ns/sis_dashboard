"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createStage,
  createGrade,
  createSection,
  createClassroom,
  isStageNameUnique,
  isGradeNameUnique,
  isSectionNameUnique,
  isClassroomNameUnique,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";

type CreateItemType = "stage" | "grade" | "section" | "classroom";

interface UseStructureCreateFlowParams {
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  reload: () => Promise<void>;
}

export function useStructureCreateFlow({
  academicYearId,
  termId,
  isReadOnly,
  grades,
  sections,
  classrooms,
  reload,
}: UseStructureCreateFlowParams) {
  const t = useTranslations("academics.structure");
  const tValidation = useTranslations("validation");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<CreateItemType>("stage");
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [newItemNameAr, setNewItemNameAr] = useState("");
  const [newItemNameEn, setNewItemNameEn] = useState("");
  const [newItemCapacity, setNewItemCapacity] = useState(30);
  const [newItemOrder, setNewItemOrder] = useState(1);
  const [addModalErrors, setAddModalErrors] = useState<{
    ar?: string;
    en?: string;
    capacity?: string;
    order?: string;
  }>({});

  const resetForm = useCallback(() => {
    setNewItemNameAr("");
    setNewItemNameEn("");
    setNewItemCapacity(30);
    setNewItemOrder(1);
    setAddModalErrors({});
  }, []);

  const openAddStage = useCallback(() => {
    if (isReadOnly) return;
    setAddModalType("stage");
    setAddModalParentId(null);
    resetForm();
    setShowAddModal(true);
  }, [isReadOnly, resetForm]);

  const openAddGrade = useCallback(
    (stageId: string) => {
      if (isReadOnly) return;
      setAddModalType("grade");
      setAddModalParentId(stageId);
      resetForm();
      setShowAddModal(true);
    },
    [isReadOnly, resetForm]
  );

  const openAddSection = useCallback(
    (gradeId: string) => {
      if (isReadOnly) return;
      setAddModalType("section");
      setAddModalParentId(gradeId);
      resetForm();
      setShowAddModal(true);
    },
    [isReadOnly, resetForm]
  );

  const openAddClassroom = useCallback(
    (sectionId: string) => {
      if (isReadOnly) return;
      setAddModalType("classroom");
      setAddModalParentId(sectionId);
      setNewItemNameAr("");
      setNewItemNameEn("");
      setNewItemCapacity(30);
      const maxOrder = classrooms
        .filter((item) => item.sectionId === sectionId)
        .reduce((max, item) => Math.max(max, item.order), 0);
      setNewItemOrder(maxOrder + 1);
      setAddModalErrors({});
      setShowAddModal(true);
    },
    [classrooms, isReadOnly]
  );

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const createItem = useCallback(async () => {
    if (isReadOnly) return;

    const nextErrors: { ar?: string; en?: string; capacity?: string; order?: string } = {};

    if (!newItemNameAr.trim()) nextErrors.ar = tValidation("required_ar");
    if (!newItemNameEn.trim()) nextErrors.en = tValidation("required_en");
    if ((addModalType === "section" || addModalType === "classroom") && newItemCapacity <= 0) {
      nextErrors.capacity = t("details.validation.capacity_required");
    }
    if (addModalType === "classroom" && newItemOrder <= 0) {
      nextErrors.order = tValidation("required");
    }

    if (newItemNameAr.trim() && newItemNameEn.trim()) {
      const arEnErrors = validateArEnDifferent(newItemNameAr, newItemNameEn);
      if (arEnErrors.arError) nextErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) nextErrors.en = tValidation("arEnMustDiffer");
    }

    if (newItemNameAr.trim() && newItemNameEn.trim() && Object.keys(nextErrors).length === 0) {
      if (addModalType === "stage") {
        const uniqueness = isStageNameUnique(academicYearId, termId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_stage");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_stage");
      } else if (addModalType === "grade" && addModalParentId) {
        const uniqueness = isGradeNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_grade");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_grade");
      } else if (addModalType === "section" && addModalParentId) {
        const uniqueness = isSectionNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_section");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_section");
      } else if (addModalType === "classroom" && addModalParentId) {
        const uniqueness = isClassroomNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_classroom");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_classroom");
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setAddModalErrors(nextErrors);
      return;
    }

    try {
      if (addModalType === "stage") {
        await createStage(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
        });
      } else if (addModalType === "grade" && addModalParentId) {
        const maxOrder = grades
          .filter((item) => item.stageId === addModalParentId)
          .reduce((max, item) => Math.max(max, item.order), 0);
        await createGrade(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          stageId: addModalParentId,
          order: maxOrder + 1,
        });
      } else if (addModalType === "section" && addModalParentId) {
        const maxOrder = sections
          .filter((item) => item.gradeId === addModalParentId)
          .reduce((max, item) => Math.max(max, item.order), 0);
        await createSection(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          gradeId: addModalParentId,
          capacity: newItemCapacity,
          order: maxOrder + 1,
        });
      } else if (addModalType === "classroom" && addModalParentId) {
        await createClassroom(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          sectionId: addModalParentId,
          capacity: newItemCapacity,
          order: newItemOrder,
        });
      }

      await reload();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  }, [
    academicYearId,
    addModalParentId,
    addModalType,
    grades,
    isReadOnly,
    newItemCapacity,
    newItemNameAr,
    newItemNameEn,
    newItemOrder,
    reload,
    resetForm,
    sections,
    t,
    tValidation,
    termId,
  ]);

  return {
    showAddModal,
    addModalType,
    newItemNameAr,
    newItemNameEn,
    newItemCapacity,
    newItemOrder,
    addModalErrors,
    setNewItemNameAr,
    setNewItemNameEn,
    setNewItemCapacity,
    setNewItemOrder,
    setAddModalErrors,
    closeAddModal,
    openAddStage,
    openAddGrade,
    openAddSection,
    openAddClassroom,
    createItem,
  };
}

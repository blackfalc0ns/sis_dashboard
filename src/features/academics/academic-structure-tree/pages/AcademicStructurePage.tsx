"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Menu, AlertCircle } from "lucide-react";
import ContextBar from "../../components/shared/ContextBar";
import StructureTree from "../components/StructureTree";
import DetailsPanel from "../../components/shared/DetailsPanel";
import InsightsPanel from "../../components/shared/InsightsPanel";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import {
  fetchStructureTree,
  fetchAcademicYears,
  fetchTermsByYear,
  createStage,
  updateStage,
  deleteStage,
  createGrade,
  updateGrade,
  deleteGrade,
  createSection,
  updateSection,
  deleteSection,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  reorderGrades,
  reorderSections,
  reorderClassrooms,
  carryOverStructure,
  isStageNameUnique,
  isGradeNameUnique,
  isSectionNameUnique,
  isClassroomNameUnique,
  Stage,
  Grade,
  Section,
  Classroom,
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";

export default function AcademicStructurePage() {
  const t = useTranslations("academics.structure");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  // Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [selectedNode, setSelectedNode] = useState<{
    type: "stage" | "grade" | "section" | "classroom";
    id: string;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTreeDrawer, setShowTreeDrawer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<"stage" | "grade" | "section" | "classroom">("stage");
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [newItemNameAr, setNewItemNameAr] = useState("");
  const [newItemNameEn, setNewItemNameEn] = useState("");
  const [newItemCapacity, setNewItemCapacity] = useState<number>(30);
  const [newItemOrder, setNewItemOrder] = useState<number>(1);
  const [addModalErrors, setAddModalErrors] = useState<{ ar?: string; en?: string; capacity?: string; order?: string }>({});
  
  // Carry Over Dialog
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const [carryOverSourceYearId, setCarryOverSourceYearId] = useState("");
  const [carryOverSourceTermId, setCarryOverSourceTermId] = useState("");
  const [carryOverSourceTerms, setCarryOverSourceTerms] = useState<Term[]>([]);
  const [copyCapacities, setCopyCapacities] = useState(true);
  const [copyOrdering, setCopyOrdering] = useState(true);
  const [isCarryingOver, setIsCarryingOver] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const isReadOnly = termStatus === "closed";
  const hasNoStructure = stages.length === 0 && grades.length === 0 && sections.length === 0 && classrooms.length === 0;

  // Initialize from URL or defaults
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        // Read from URL or use defaults
        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        // Auto-select term: prefer Open, else first term
        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          // Update URL
          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load structure when year/term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadStructure = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStructureTree(academicYearId, termId);
        setStages(data.stages);
        setGrades(data.grades);
        setSections(data.sections);
        setClassrooms(data.classrooms);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStructure();
  }, [academicYearId, termId]);

  const updateURL = useCallback((yearId: string, tId: string) => {
    const params = new URLSearchParams();
    params.set("year", yearId);
    params.set("term", tId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);

  const loadData = useCallback(async () => {
    if (!academicYearId || !termId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStructureTree(academicYearId, termId);
      setStages(data.stages);
      setGrades(data.grades);
      setSections(data.sections);
      setClassrooms(data.classrooms);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, termId]);

  const handleAcademicYearChange = async (yearId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("details.discard_dialog.message"))) return;
      setHasUnsavedChanges(false);
    }

    setAcademicYearId(yearId);

    // Fetch terms for new year
    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    // Auto-select first open term or first term
    const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      updateURL(yearId, defaultTerm.id);
    }
  };

  const handleTermChange = (tId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("details.discard_dialog.message"))) return;
      setHasUnsavedChanges(false);
    }

    const selectedTerm = terms.find((t) => t.id === tId);
    if (selectedTerm) {
      setTermId(tId);
      setTermStatus(selectedTerm.status);
      updateURL(academicYearId, tId);
    }
  };

  const handleSelectNode = (node: { type: "stage" | "grade" | "section" | "classroom"; id: string }) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("details.discard_dialog.message"))) return;
      setHasUnsavedChanges(false);
    }
    setSelectedNode(node);
  };

  const handleAddClassroom = (sectionId: string) => {
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
  };

  const handleAddStage = () => {
    if (isReadOnly) return;
    setAddModalType("stage");
    setAddModalParentId(null);
    setNewItemNameAr("");
    setNewItemNameEn("");
    setNewItemCapacity(30);
    setNewItemOrder(1);
    setAddModalErrors({});
    setShowAddModal(true);
  };

  const handleAddGrade = (stageId: string) => {
    if (isReadOnly) return;
    setAddModalType("grade");
    setAddModalParentId(stageId);
    setNewItemNameAr("");
    setNewItemNameEn("");
    setNewItemCapacity(30);
    setNewItemOrder(1);
    setAddModalErrors({});
    setShowAddModal(true);
  };

  const handleAddSection = (gradeId: string) => {
    if (isReadOnly) return;
    setAddModalType("section");
    setAddModalParentId(gradeId);
    setNewItemNameAr("");
    setNewItemNameEn("");
    setNewItemCapacity(30);
    setNewItemOrder(1);
    setAddModalErrors({});
    setShowAddModal(true);
  };

  const handleCreateItem = async () => {
    if (isReadOnly) return;

    // Validation
    const newErrors: { ar?: string; en?: string; capacity?: string; order?: string } = {};
    if (!newItemNameAr.trim()) newErrors.ar = tValidation("required_ar");
    if (!newItemNameEn.trim()) newErrors.en = tValidation("required_en");
    if ((addModalType === "section" || addModalType === "classroom") && newItemCapacity <= 0) {
      newErrors.capacity = t("details.validation.capacity_required");
    }
    if (addModalType === "classroom" && newItemOrder <= 0) {
      newErrors.order = tValidation("required");
    }

    // AR != EN validation
    if (newItemNameAr.trim() && newItemNameEn.trim()) {
      const arEnErrors = validateArEnDifferent(newItemNameAr, newItemNameEn);
      if (arEnErrors.arError) {
        newErrors.ar = tValidation("arEnMustDiffer");
      }
      if (arEnErrors.enError) {
        newErrors.en = tValidation("arEnMustDiffer");
      }
    }

    // Uniqueness validation (only if AR != EN passed)
    if (newItemNameAr.trim() && newItemNameEn.trim() && Object.keys(newErrors).length === 0) {
      if (addModalType === "stage") {
        const uniqueness = isStageNameUnique(academicYearId, termId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) newErrors.ar = tValidation("unique_name_ar_stage");
        if (!uniqueness.uniqueEn) newErrors.en = tValidation("unique_name_en_stage");
      } else if (addModalType === "grade" && addModalParentId) {
        const uniqueness = isGradeNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) newErrors.ar = tValidation("unique_name_ar_grade");
        if (!uniqueness.uniqueEn) newErrors.en = tValidation("unique_name_en_grade");
      } else if (addModalType === "section" && addModalParentId) {
        const uniqueness = isSectionNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) newErrors.ar = tValidation("unique_name_ar_section");
        if (!uniqueness.uniqueEn) newErrors.en = tValidation("unique_name_en_section");
      } else if (addModalType === "classroom" && addModalParentId) {
        const uniqueness = isClassroomNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) newErrors.ar = tValidation("unique_name_ar_classroom");
        if (!uniqueness.uniqueEn) newErrors.en = tValidation("unique_name_en_classroom");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setAddModalErrors(newErrors);
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
          .filter((g) => g.stageId === addModalParentId)
          .reduce((max, g) => Math.max(max, g.order), 0);
        await createGrade(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          stageId: addModalParentId,
          order: maxOrder + 1,
        });
      } else if (addModalType === "section" && addModalParentId) {
        const maxOrder = sections
          .filter((s) => s.gradeId === addModalParentId)
          .reduce((max, s) => Math.max(max, s.order), 0);
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
      await loadData();
      setShowAddModal(false);
      setNewItemNameAr("");
      setNewItemNameEn("");
      setNewItemCapacity(30);
      setNewItemOrder(1);
      setAddModalErrors({});
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  };

  const handleSave = async (
    type: "stage" | "grade" | "section" | "classroom",
    id: string | null,
    data: Partial<Stage | Grade | Section | Classroom>
  ) => {
    if (!id || isReadOnly) return;

    try {
      if (type === "stage") {
        const updated = await updateStage(academicYearId, termId, id, data);
        setStages(stages.map((s) => (s.id === id ? updated : s)));
      } else if (type === "grade") {
        await updateGrade(academicYearId, termId, id, data);
        await loadData();
      } else if (type === "section") {
        await updateSection(academicYearId, termId, id, data);
        await loadData();
      } else if (type === "classroom") {
        await updateClassroom(academicYearId, termId, id, data);
        await loadData();
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to save:", err);
      throw err;
    }
  };

  const handleDelete = async (type: "stage" | "grade" | "section" | "classroom", id: string) => {
    if (isReadOnly || !confirm(t("confirm_delete"))) return;

    try {
      if (type === "stage") {
        await deleteStage(academicYearId, termId, id);
      } else if (type === "grade") {
        await deleteGrade(academicYearId, termId, id);
      } else if (type === "section") {
        await deleteSection(academicYearId, termId, id);
      } else if (type === "classroom") {
        await deleteClassroom(academicYearId, termId, id);
      }
      await loadData();
      setSelectedNode(null);
    } catch (err) {
      console.error("Failed to delete:", err);
      throw err;
    }
  };

  const handleReorderGrade = async (gradeId: string, direction: "up" | "down") => {
    if (isReadOnly) return;

    const grade = grades.find((g) => g.id === gradeId);
    if (!grade) return;

    const stageGrades = grades
      .filter((g) => g.stageId === grade.stageId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = stageGrades.findIndex((g) => g.id === gradeId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === stageGrades.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapGrade = stageGrades[newIndex];

    const updatedGrades = [...grades];
    const gradeToUpdate = updatedGrades.find((g) => g.id === gradeId);
    const swapGradeToUpdate = updatedGrades.find((g) => g.id === swapGrade.id);

    if (gradeToUpdate && swapGradeToUpdate) {
      const tempOrder = gradeToUpdate.order;
      gradeToUpdate.order = swapGradeToUpdate.order;
      swapGradeToUpdate.order = tempOrder;
      setGrades(updatedGrades);

      try {
        const orderedIds = stageGrades.map((g) =>
          g.id === gradeId ? swapGrade.id : g.id === swapGrade.id ? gradeId : g.id
        );
        await reorderGrades(academicYearId, termId, grade.stageId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder:", err);
        setGrades(grades);
      }
    }
  };

  const handleDragReorder = async (stageId: string, oldIndex: number, newIndex: number) => {
    if (isReadOnly) return;

    const stageGrades = grades
      .filter((g) => g.stageId === stageId)
      .sort((a, b) => a.order - b.order);

    // Optimistic update
    const reorderedGrades = [...stageGrades];
    const [movedGrade] = reorderedGrades.splice(oldIndex, 1);
    reorderedGrades.splice(newIndex, 0, movedGrade);

    // Update orders
    const updatedGrades = grades.map((g) => {
      if (g.stageId !== stageId) return g;
      const newOrder = reorderedGrades.findIndex((rg) => rg.id === g.id);
      return { ...g, order: newOrder + 1 };
    });

    setGrades(updatedGrades);

    try {
      const orderedIds = reorderedGrades.map((g) => g.id);
      await reorderGrades(academicYearId, termId, stageId, orderedIds);
      setSnackbar({
        open: true,
        message: t("reorder_saved"),
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to reorder:", err);
      // Rollback
      setGrades(grades);
      setSnackbar({
        open: true,
        message: t("reorder_failed"),
        severity: "error",
      });
    }
  };

  const handleDragReorderSection = async (gradeId: string, oldIndex: number, newIndex: number) => {
    if (isReadOnly) return;

    const gradeSections = sections
      .filter((section) => section.gradeId === gradeId)
      .sort((a, b) => a.order - b.order);

    const reorderedSections = [...gradeSections];
    const [movedSection] = reorderedSections.splice(oldIndex, 1);
    reorderedSections.splice(newIndex, 0, movedSection);

    const updatedSections = sections.map((section) => {
      if (section.gradeId !== gradeId) return section;
      const newOrder = reorderedSections.findIndex((item) => item.id === section.id);
      return { ...section, order: newOrder + 1 };
    });

    setSections(updatedSections);

    try {
      const orderedIds = reorderedSections.map((section) => section.id);
      await reorderSections(academicYearId, termId, gradeId, orderedIds);
      setSnackbar({
        open: true,
        message: t("reorder_saved"),
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to reorder sections:", err);
      setSections(sections);
      setSnackbar({
        open: true,
        message: t("reorder_failed"),
        severity: "error",
      });
    }
  };

  const handleReorderSection = async (sectionId: string, direction: "up" | "down") => {
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

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swappedSection = gradeSections[newIndex];

    const updatedSections = [...sections];
    const currentSection = updatedSections.find((item) => item.id === sectionId);
    const swapSection = updatedSections.find((item) => item.id === swappedSection.id);

    if (currentSection && swapSection) {
      const tempOrder = currentSection.order;
      currentSection.order = swapSection.order;
      swapSection.order = tempOrder;
      setSections(updatedSections);

      try {
        const orderedIds = gradeSections.map((item) =>
          item.id === sectionId ? swappedSection.id : item.id === swappedSection.id ? sectionId : item.id
        );
        await reorderSections(academicYearId, termId, section.gradeId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder sections:", err);
        setSections(sections);
      }
    }
  };

  const handleDragReorderClassroom = async (sectionId: string, oldIndex: number, newIndex: number) => {
    if (isReadOnly) return;

    const sectionClassrooms = classrooms
      .filter((item) => item.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);

    const reorderedClassrooms = [...sectionClassrooms];
    const [movedClassroom] = reorderedClassrooms.splice(oldIndex, 1);
    reorderedClassrooms.splice(newIndex, 0, movedClassroom);

    const updatedClassrooms = classrooms.map((item) => {
      if (item.sectionId !== sectionId) return item;
      const nextOrder = reorderedClassrooms.findIndex((reordered) => reordered.id === item.id);
      return { ...item, order: nextOrder + 1 };
    });

    setClassrooms(updatedClassrooms);

    try {
      const orderedIds = reorderedClassrooms.map((item) => item.id);
      await reorderClassrooms(academicYearId, termId, sectionId, orderedIds);
      setSnackbar({
        open: true,
        message: t("reorder_saved"),
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to reorder classrooms:", err);
      setClassrooms(classrooms);
      setSnackbar({
        open: true,
        message: t("reorder_failed"),
        severity: "error",
      });
    }
  };

  const handleReorderClassroom = async (classroomId: string, direction: "up" | "down") => {
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

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapClassroom = sectionClassrooms[newIndex];

    const updatedClassrooms = [...classrooms];
    const classroomToUpdate = updatedClassrooms.find((item) => item.id === classroomId);
    const swapClassroomToUpdate = updatedClassrooms.find((item) => item.id === swapClassroom.id);

    if (classroomToUpdate && swapClassroomToUpdate) {
      const tempOrder = classroomToUpdate.order;
      classroomToUpdate.order = swapClassroomToUpdate.order;
      swapClassroomToUpdate.order = tempOrder;
      setClassrooms(updatedClassrooms);

      try {
        const orderedIds = sectionClassrooms.map((item) =>
          item.id === classroomId ? swapClassroom.id : item.id === swapClassroom.id ? classroomId : item.id
        );
        await reorderClassrooms(academicYearId, termId, classroom.sectionId, orderedIds);
      } catch (err) {
        console.error("Failed to reorder classrooms:", err);
        setClassrooms(classrooms);
      }
    }
  };

  const handlePromoteCarryOver = () => {
    setShowCarryOverDialog(true);
    setCarryOverSourceYearId(academicYearId);
    setCarryOverSourceTermId("");
  };

  const handleCarryOverSourceYearChange = async (yearId: string) => {
    setCarryOverSourceYearId(yearId);
    const yearTerms = await fetchTermsByYear(yearId);
    setCarryOverSourceTerms(yearTerms);
    setCarryOverSourceTermId("");
  };

  const handleCarryOver = async () => {
    if (!carryOverSourceYearId || !carryOverSourceTermId) return;

    setIsCarryingOver(true);
    try {
      await carryOverStructure({
        fromYearId: carryOverSourceYearId,
        fromTermId: carryOverSourceTermId,
        toYearId: academicYearId,
        toTermId: termId,
        copyCapacities,
        copyOrdering,
      });

      setSnackbar({
        open: true,
        message: t("carry_over_dialog.success"),
        severity: "success",
      });

      setShowCarryOverDialog(false);
      await loadData();
    } catch (err) {
      console.error("Failed to carry over:", err);
      setSnackbar({
        open: true,
        message: t("carry_over_dialog.error"),
        severity: "error",
      });
    } finally {
      setIsCarryingOver(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        onPromoteCarryOver={handlePromoteCarryOver}
        isReadOnly={isReadOnly}
      />

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner.message")}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && hasNoStructure && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("empty_state.title")}</h3>
            <p className="text-gray-600 mb-6">{t("empty_state.message")}</p>
            <div className="flex gap-3 justify-center">
              {!isReadOnly && (
                <Button variant="primary" onClick={handleAddStage}>
                  {t("empty_state.add_stage")}
                </Button>
              )}
              <Button variant="secondary" onClick={handlePromoteCarryOver} disabled={isReadOnly}>
                {t("empty_state.carry_over")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!hasNoStructure && (
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile: Tree Toggle Button */}
          <div className="lg:hidden fixed bottom-4 left-4 z-50">
            <button
              onClick={() => setShowTreeDrawer(true)}
              className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-hover"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop: Tree Panel */}
          <div className="hidden lg:block w-100 border-r border-l border-border bg-white overflow-hidden">
            <StructureTree
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              onAddStage={handleAddStage}
              onAddGrade={handleAddGrade}
              onAddSection={handleAddSection}
              onAddClassroom={handleAddClassroom}
              onEdit={(type, id) => handleSelectNode({ type, id })}
              onDelete={handleDelete}
              onReorderGrade={handleReorderGrade}
              onReorderSection={handleReorderSection}
              onReorderClassroom={handleReorderClassroom}
              onDragReorder={handleDragReorder}
              onDragReorderSection={handleDragReorderSection}
              onDragReorderClassroom={handleDragReorderClassroom}
              isReadOnly={isReadOnly}
            />
          </div>

          {/* Mobile: Tree Drawer */}
          {showTreeDrawer && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowTreeDrawer(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-hidden flex flex-col">
                {/* Drawer Header */}
                <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t("tree.search_placeholder")}</h3>
                  <button
                    onClick={() => setShowTreeDrawer(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Tree Content */}
                <div className="flex-1 overflow-hidden">
                  <StructureTree
                    stages={stages}
                    grades={grades}
                    sections={sections}
                    classrooms={classrooms}
                    selectedNode={selectedNode}
                    onSelectNode={(node) => {
                      handleSelectNode(node);
                      // Close drawer after a short delay to show selection feedback
                      setTimeout(() => setShowTreeDrawer(false), 300);
                    }}
                    onAddStage={handleAddStage}
                    onAddGrade={handleAddGrade}
                    onAddSection={handleAddSection}
                    onAddClassroom={handleAddClassroom}
                    onEdit={(type, id) => {
                      handleSelectNode({ type, id });
                      setTimeout(() => setShowTreeDrawer(false), 300);
                    }}
                    onDelete={handleDelete}
                    onReorderGrade={handleReorderGrade}
                    onReorderSection={handleReorderSection}
                    onReorderClassroom={handleReorderClassroom}
                    onDragReorder={handleDragReorder}
                    onDragReorderSection={handleDragReorderSection}
                    onDragReorderClassroom={handleDragReorderClassroom}
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Details Panel */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <DetailsPanel
              selectedNode={selectedNode}
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              onSave={handleSave}
              onDelete={handleDelete}
              isReadOnly={isReadOnly}
              onDirtyChange={setHasUnsavedChanges}
              academicYearId={academicYearId}
              termId={termId}
            />
          </div>

          {/* Insights Panel */}
          <div className="hidden xl:block w-80 border-l border-border bg-gray-50 overflow-hidden">
            <InsightsPanel
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          addModalType === "stage"
            ? t("modals.add_stage")
            : addModalType === "grade"
              ? t("modals.add_grade")
              : addModalType === "section"
                ? t("modals.add_section")
                : t("modals.add_classroom")
        }
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowAddModal(false)} variant="secondary">
              {t("modals.cancel")}
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={
                !newItemNameAr.trim() ||
                !newItemNameEn.trim() ||
                ((addModalType === "section" || addModalType === "classroom") && newItemCapacity <= 0) ||
                (addModalType === "classroom" && newItemOrder <= 0)
              }
              variant="primary"
            >
              {t("modals.create")}
            </Button>
          </>
        }
      >
        <BilingualTextField
          label={t("modals.name")}
          value={{ ar: newItemNameAr, en: newItemNameEn }}
          onChange={(value) => {
            setNewItemNameAr(value.ar);
            setNewItemNameEn(value.en);
            setAddModalErrors({});
          }}
          requiredAr
          requiredEn
          errors={addModalErrors}
        />
        {(addModalType === "section" || addModalType === "classroom") && (
          <div className="mt-4">
            <Input
              label={t("details.capacity")}
              type="number"
              min="1"
              value={newItemCapacity}
              onChange={(e) => {
                setNewItemCapacity(parseInt(e.target.value, 10) || 0);
                setAddModalErrors((prev) => ({ ...prev, capacity: undefined }));
              }}
              error={addModalErrors.capacity}
            />
          </div>
        )}
        {addModalType === "classroom" && (
          <div className="mt-4">
            <Input
              label={t("details.order")}
              type="number"
              min="1"
              value={newItemOrder}
              onChange={(e) => {
                setNewItemOrder(parseInt(e.target.value, 10) || 0);
                setAddModalErrors((prev) => ({ ...prev, order: undefined }));
              }}
              error={addModalErrors.order}
            />
          </div>
        )}
      </Modal>

      {/* Carry Over Dialog */}
      <Modal
        isOpen={showCarryOverDialog}
        onClose={() => setShowCarryOverDialog(false)}
        title={t("carry_over_dialog.title")}
        size="md"
        footer={
          <>
            <Button onClick={() => setShowCarryOverDialog(false)} variant="secondary">
              {t("carry_over_dialog.cancel")}
            </Button>
            <Button
              onClick={handleCarryOver}
              disabled={!carryOverSourceYearId || !carryOverSourceTermId || isCarryingOver}
              variant="primary"
            >
              {t("carry_over_dialog.carry_over")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t("carry_over_dialog.description")}</p>

          <Select
            label={t("carry_over_dialog.source_year")}
            required
            value={carryOverSourceYearId}
            onChange={handleCarryOverSourceYearChange}
            options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
            selectSize="md"
          />

          <Select
            label={t("carry_over_dialog.source_term")}
            required
            value={carryOverSourceTermId}
            onChange={setCarryOverSourceTermId}
            options={carryOverSourceTerms.map((t) => ({ value: t.id, label: t.name }))}
            selectSize="md"
            disabled={!carryOverSourceYearId}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("carry_over_dialog.options")}</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={copyCapacities}
                  onChange={(e) => setCopyCapacities(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-gray-700">{t("carry_over_dialog.copy_capacities")}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={copyOrdering}
                  onChange={(e) => setCopyOrdering(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-gray-700">{t("carry_over_dialog.copy_ordering")}</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Snackbar Notification */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
            snackbar.severity === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

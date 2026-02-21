"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stage, Grade, Section } from "@/services/academics/structureService";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";

interface StructureTreeProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  selectedNode: { type: "stage" | "grade" | "section"; id: string } | null;
  onSelectNode: (node: { type: "stage" | "grade" | "section"; id: string }) => void;
  onAddStage: () => void;
  onAddGrade: (stageId: string) => void;
  onAddSection: (gradeId: string) => void;
  onEdit: (type: "stage" | "grade" | "section", id: string) => void;
  onDelete: (type: "stage" | "grade" | "section", id: string) => void;
  onReorderGrade: (gradeId: string, direction: "up" | "down") => void;
  onDragReorder: (stageId: string, oldIndex: number, newIndex: number) => Promise<void>;
  isReadOnly?: boolean;
}

interface SortableGradeItemProps {
  grade: Grade;
  index: number;
  totalGrades: number;
  isSelected: boolean;
  isExpanded: boolean;
  sections: Section[];
  selectedNode: { type: "stage" | "grade" | "section"; id: string } | null;
  onSelectNode: (node: { type: "stage" | "grade" | "section"; id: string }) => void;
  onToggleGrade: (gradeId: string) => void;
  onReorderGrade: (gradeId: string, direction: "up" | "down") => void;
  onAddSection: (gradeId: string) => void;
  onEdit: (type: "stage" | "grade" | "section", id: string) => void;
  onDelete: (type: "stage" | "grade" | "section", id: string) => void;
  isDragging: boolean;
}

function SortableGradeItem({
  grade,
  index,
  totalGrades,
  isSelected,
  isExpanded,
  sections,
  selectedNode,
  onSelectNode,
  onToggleGrade,
  onReorderGrade,
  onAddSection,
  onEdit,
  onDelete,
  isDragging,
}: SortableGradeItemProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: grade.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      {/* Grade */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
          isSelected
            ? "bg-primary/10 border border-primary"
            : "hover:bg-gray-50"
        } ${isSortableDragging ? "shadow-lg z-50" : ""}`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none"
          title={t("tree.drag_to_reorder")}
          aria-label={t("tree.drag_to_reorder")}
          disabled={isDragging}
        >
          <GripVertical className={`w-4 h-4 ${isDragging ? "text-gray-300" : "text-gray-400"}`} />
        </button>

        <button
          onClick={() => onToggleGrade(grade.id)}
          className="p-1 hover:bg-gray-200 rounded touch-manipulation"
          aria-label="Toggle grade"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div
          onClick={() => onSelectNode({ type: "grade", id: grade.id })}
          className="flex-1 text-sm cursor-pointer py-1 touch-manipulation"
        >
          {grade.name}
        </div>

        {/* Fallback Up/Down buttons */}
        <button
          onClick={() => onReorderGrade(grade.id, "up")}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_up")}
          aria-label={t("tree.move_up")}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onReorderGrade(grade.id, "down")}
          disabled={index === totalGrades - 1}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_down")}
          aria-label={t("tree.move_down")}
        >
          <ArrowDown className="w-3 h-3" />
        </button>

        <button
          onClick={() => onAddSection(grade.id)}
          className="p-1 hover:bg-gray-200 rounded"
          title={t("tree.add_section")}
        >
          <Plus className="w-3 h-3" />
        </button>
        <DropdownMenu
          trigger={
            <button className="p-1 hover:bg-gray-200 rounded">
              <MoreVertical className="w-3 h-3" />
            </button>
          }
          items={[
            {
              label: t("tree.edit"),
              value: "edit",
                                      icon: <Edit2 className="w-4 h-4" />,
              
              onClick: () => onEdit("grade", grade.id),
            },
            {
              label: t("tree.delete"),
              value: "delete",
                                      icon: <Trash2 className="w-4 h-4" />,

              onClick: () => onDelete("grade", grade.id),
            },
          ]}
          width="w-32"
        />
      </div>

      {/* Sections */}
      {isExpanded && (
        <div className={`${isRTL ? "mr-6" : "ml-6"} space-y-1`}>
          {sections.map((section) => {
            const isSectionSelected =
              selectedNode?.type === "section" && selectedNode.id === section.id;

            return (
              <div
                key={section.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors touch-manipulation ${
                  isSectionSelected
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectNode({ type: "section", id: section.id })}
              >
                <div className="w-4" />
                <div className="flex-1 text-sm text-gray-600">
                  {section.name}
                </div>
                <DropdownMenu
                  trigger={
                    <button 
                      className="p-1 hover:bg-gray-200 rounded touch-manipulation"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  }
                  items={[
                    {
                      label: t("tree.edit"),
                      value: "edit",
                                              icon: <Edit2 className="w-4 h-4" />,

                      onClick: () => onEdit("section", section.id),
                    },
                    {
                      label: t("tree.delete"),
                      value: "delete",
                                              icon: <Trash2 className="w-4 h-4" />,
                      
                      onClick: () => onDelete("section", section.id),
                    },
                  ]}
                  width="w-32"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StructureTree({
  stages,
  grades,
  sections,
  selectedNode,
  onSelectNode,
  onAddStage,
  onAddGrade,
  onAddSection,
  onEdit,
  onDelete,
  onReorderGrade,
  onDragReorder,
  isReadOnly = false,
}: StructureTreeProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(stages.map((s) => s.id))
  );
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors with touch support and activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return { stages, grades, sections };

    const query = searchQuery.toLowerCase();
    const matchedSections = sections.filter((s) =>
      s.name.toLowerCase().includes(query)
    );
    const matchedGrades = grades.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        matchedSections.some((s) => s.gradeId === g.id)
    );
    const matchedStages = stages.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        matchedGrades.some((g) => g.stageId === s.id)
    );

    return {
      stages: matchedStages,
      grades: matchedGrades,
      sections: matchedSections,
    };
  }, [searchQuery, stages, grades, sections]);

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const toggleGrade = (gradeId: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(gradeId)) next.delete(gradeId);
      else next.add(gradeId);
      return next;
    });
  };

  const getGradesByStage = (stageId: string) => {
    return filteredData.grades
      .filter((g) => g.stageId === stageId)
      .sort((a, b) => a.order - b.order);
  };

  const getSectionsByGrade = (gradeId: string) => {
    return filteredData.sections.filter((s) => s.gradeId === gradeId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeGrade = grades.find((g) => g.id === active.id);
    const overGrade = grades.find((g) => g.id === over.id);

    if (!activeGrade || !overGrade) {
      setActiveId(null);
      return;
    }

    // Prevent cross-stage moves
    if (activeGrade.stageId !== overGrade.stageId) {
      setActiveId(null);
      return;
    }

    const stageGrades = getGradesByStage(activeGrade.stageId);
    const oldIndex = stageGrades.findIndex((g) => g.id === active.id);
    const newIndex = stageGrades.findIndex((g) => g.id === over.id);

    if (oldIndex !== newIndex) {
      await onDragReorder(activeGrade.stageId, oldIndex, newIndex);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get the active grade for drag overlay
  const activeGrade = activeId ? grades.find((g) => g.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("tree.search_placeholder")}
          leftIcon={<Search className="w-4 h-4" />}
          inputSize="md"
        />
      </div>

      {/* Add Stage Button */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onAddStage}
          variant="primary"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isReadOnly}
        >
          {t("tree.add_stage")}
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredData.stages.map((stage) => {
          const stageGrades = getGradesByStage(stage.id);
          const isExpanded = expandedStages.has(stage.id);
          const isSelected =
            selectedNode?.type === "stage" && selectedNode.id === stage.id;

          return (
            <div key={stage.id} className="space-y-1">
              {/* Stage */}
              <div
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => toggleStage(stage.id)}
                  className="p-1 hover:bg-gray-200 rounded touch-manipulation"
                  aria-label="Toggle stage"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div
                  onClick={() => onSelectNode({ type: "stage", id: stage.id })}
                  className="flex-1 font-medium cursor-pointer py-1 touch-manipulation"
                >
                  {stage.name}
                </div>
                <button
                  onClick={() => onAddGrade(stage.id)}
                  className="p-1 hover:bg-gray-200 rounded touch-manipulation"
                  title={t("tree.add_grade")}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <DropdownMenu
                  trigger={
                    <button className="p-1 hover:bg-gray-200 rounded touch-manipulation">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  }
                  items={[
                    {
                      label: t("tree.edit"),
                      value: "edit",
                                              icon: <Edit2 className="w-4 h-4" />,
                      
                      onClick: () => onEdit("stage", stage.id),
                    },
                    {
                      label: t("tree.delete"),
                      value: "delete",
                                              icon: <Trash2 className="w-4 h-4" />,
                      
                      onClick: () => onDelete("stage", stage.id),
                    },
                  ]}
                  width="w-32"
                />
              </div>

              {/* Grades - Sortable */}
              {isExpanded && stageGrades.length > 0 && (
                <div className={`${isRTL ? "mr-6" : "ml-6"}`}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={stageGrades.map((g) => g.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {stageGrades.map((grade, index) => {
                        const gradeSections = getSectionsByGrade(grade.id);
                        const isGradeExpanded = expandedGrades.has(grade.id);
                        const isGradeSelected =
                          selectedNode?.type === "grade" &&
                          selectedNode.id === grade.id;

                        return (
                          <SortableGradeItem
                            key={grade.id}
                            grade={grade}
                            index={index}
                            totalGrades={stageGrades.length}
                            isSelected={isGradeSelected}
                            isExpanded={isGradeExpanded}
                            sections={gradeSections}
                            selectedNode={selectedNode}
                            onSelectNode={onSelectNode}
                            onToggleGrade={toggleGrade}
                            onReorderGrade={onReorderGrade}
                            onAddSection={onAddSection}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isDragging={activeId === grade.id}
                          />
                        );
                      })}
                    </SortableContext>

                    {/* Drag Overlay */}
                    <DragOverlay>
                      {activeGrade ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-primary shadow-lg">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <ChevronRight className="w-4 h-4" />
                          <div className="flex-1 text-sm font-medium">
                            {activeGrade.name}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

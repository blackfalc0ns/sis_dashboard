"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Stage, Grade, Section } from "@/services/academics/structureService";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Button from "@/components/ui/button/Button";

interface DetailsPanelProps {
  selectedNode: { type: "stage" | "grade" | "section"; id: string } | null;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  onSave: (
    type: "stage" | "grade" | "section",
    id: string | null,
    data: Partial<Stage | Grade | Section>
  ) => Promise<void>;
  onDelete: (type: "stage" | "grade" | "section", id: string) => Promise<void>;
  isReadOnly?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export default function DetailsPanel({
  selectedNode,
  stages,
  grades,
  sections,
  onSave,
  onDelete,
  isReadOnly = false,
  onDirtyChange,
}: DetailsPanelProps) {
  const t = useTranslations("academics.structure.details");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNode, setPendingNode] = useState<typeof selectedNode>(null);

  const loadNodeData = useCallback((node: typeof selectedNode) => {
    if (!node) return;

    let data: Record<string, unknown> = {};
    if (node.type === "stage") {
      const stage = stages.find((s) => s.id === node.id);
      data = stage ? { ...stage } : {};
    } else if (node.type === "grade") {
      const grade = grades.find((g) => g.id === node.id);
      data = grade ? { ...grade } : {};
    } else if (node.type === "section") {
      const section = sections.find((s) => s.id === node.id);
      data = section ? { ...section } : {};
    }
    setFormData(data);
    setIsDirty(false);
    setErrors({});
  }, [stages, grades, sections]);

  useEffect(() => {
    if (!selectedNode) {
      setFormData({});
      setIsDirty(false);
      return;
    }

    if (isDirty) {
      setPendingNode(selectedNode);
      setShowDiscardDialog(true);
      return;
    }

    loadNodeData(selectedNode);
  }, [selectedNode, isDirty, loadNodeData]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const nameValue = formData.name as string | undefined;
    if (!nameValue?.trim()) {
      newErrors.name = t("validation.name_required");
    }

    if (selectedNode?.type === "section") {
      const capacityValue = formData.capacity as number | undefined;
      if (!capacityValue || capacityValue <= 0) {
        newErrors.capacity = t("validation.capacity_required");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !selectedNode || isReadOnly) return;

    try {
      await onSave(selectedNode.type, selectedNode.id, formData);
      setIsDirty(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleCancel = () => {
    if (selectedNode) {
      loadNodeData(selectedNode);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode || isReadOnly) return;
    try {
      await onDelete(selectedNode.type, selectedNode.id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardDialog(false);
    setIsDirty(false);
    if (pendingNode) {
      loadNodeData(pendingNode);
      setPendingNode(null);
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>{t("no_selection")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 h-full overflow-y-auto">
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedNode.type === "stage" && t("stage_form")}
            {selectedNode.type === "grade" && t("grade_form")}
            {selectedNode.type === "section" && t("section_form")}
          </h3>

          {/* Stage Form */}
          {selectedNode.type === "stage" && (
            <>
              <Input
                label={t("name")}
                required
                value={(formData.name as string) || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                disabled={isReadOnly}
              />
              <TextArea
                label={t("description")}
                value={(formData.description as string) || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {/* Grade Form */}
          {selectedNode.type === "grade" && (
            <>
              <Input
                label={t("name")}
                required
                value={(formData.name as string) || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                disabled={isReadOnly}
              />
              <Input
                label={t("stage")}
                value={stages.find((s) => s.id === (formData.stageId as string))?.name || ""}
                disabled
              />
              <Input
                label={t("order")}
                type="number"
                value={(formData.order as number) || ""}
                disabled
              />
              <TextArea
                label={t("notes")}
                value={(formData.notes as string) || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {/* Section Form */}
          {selectedNode.type === "section" && (
            <>
              <Input
                label={t("name")}
                required
                value={(formData.name as string) || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                disabled={isReadOnly}
              />
              <Input
                label={t("capacity")}
                required
                type="number"
                min="1"
                value={(formData.capacity as number) || ""}
                onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                error={errors.capacity}
                disabled={isReadOnly}
              />
              <TextArea
                label={t("notes")}
                value={(formData.notes as string) || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={!isDirty || isReadOnly} variant="primary">
              {t("save")}
            </Button>
            <Button onClick={handleCancel} disabled={!isDirty || isReadOnly} variant="secondary">
              {t("cancel")}
            </Button>
            <Button onClick={handleDelete} variant="danger" className="ml-auto" disabled={isReadOnly}>
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>

      {/* Discard Changes Dialog */}
      <Modal
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title={t("discard_dialog.title")}
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowDiscardDialog(false)} variant="secondary">
              {t("discard_dialog.stay")}
            </Button>
            <Button onClick={handleDiscardChanges} variant="danger">
              {t("discard_dialog.discard")}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">{t("discard_dialog.message")}</p>
      </Modal>
    </>
  );
}

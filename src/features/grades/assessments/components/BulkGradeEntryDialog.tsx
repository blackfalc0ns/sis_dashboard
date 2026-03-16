"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import Modal from "@/components/ui/modal/Modal";
import type {
  Assessment,
  AssessmentRosterItem,
  BulkGradeItemPayload,
  GradeItemStatus,
} from "../types";

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: BulkGradeItemPayload[]) => Promise<void>;
  assessment: Assessment | null;
  rows: AssessmentRosterItem[];
  isSubmitting: boolean;
}

type EditableRow = AssessmentRosterItem;

export default function BulkGradeEntryDialog({
  isOpen,
  onClose,
  onSubmit,
  assessment,
  rows,
  isSubmitting,
}: BulkGradeEntryDialogProps) {
  const t = useTranslations("academics.grades.dialogs.bulkEntry");
  const locale = useLocale();
  const [editableRows, setEditableRows] = useState<EditableRow[]>(rows);

  const statusOptions = useMemo(
    () => [
      { value: "entered", label: t("statuses.entered") },
      { value: "missing", label: t("statuses.missing") },
      { value: "absent", label: t("statuses.absent") },
    ],
    [t],
  );

  const handleRowChange = (
    studentId: string,
    field: "status" | "score" | "comment",
    value: string,
  ) => {
    setEditableRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) {
          return row;
        }

        if (field === "status") {
          const nextStatus = value as GradeItemStatus;
          return {
            ...row,
            status: nextStatus,
            score: nextStatus === "entered" ? row.score : null,
          };
        }

        if (field === "score") {
          return {
            ...row,
            score: value === "" ? null : Number(value),
          };
        }

        return {
          ...row,
          comment: value,
        };
      }),
    );
  };

  const handleSubmit = async () => {
    await onSubmit(
      editableRows.map((row) => ({
        studentId: row.studentId,
        status: row.status,
        score: row.status === "entered" ? row.score : null,
        comment: row.comment,
      })),
    );
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      description={t("description", {
        assessment: locale === "ar" ? assessment?.titleAr || "-" : assessment?.title || "-",
      })}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
        {assessment ? t("scoreHelp", { maxScore: assessment.maxScore }) : ""}
      </div>
      <div className="max-h-[60vh] overflow-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: "var(--surface-secondary)" }}>
            <tr>
              <th className="px-3 py-2 text-start font-medium">{t("student")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("classroom")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("status")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("score")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("comment")}</th>
            </tr>
          </thead>
          <tbody>
            {editableRows.map((row) => (
              <tr key={row.studentId} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-3 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                  {locale === "ar" ? row.studentNameAr : row.studentNameEn}
                </td>
                <td className="px-3 py-3" style={{ color: "var(--text-secondary)" }}>
                  {row.classroomName || t("notAssigned")}
                </td>
                <td className="px-3 py-3 align-top">
                  <Select
                    value={row.status}
                    onChange={(value) => handleRowChange(row.studentId, "status", value)}
                    options={statusOptions}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <Input
                    type="number"
                    min="0"
                    max={assessment?.maxScore || 100}
                    value={row.score == null ? "" : String(row.score)}
                    onChange={(event) => handleRowChange(row.studentId, "score", event.target.value)}
                    disabled={row.status !== "entered"}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <TextArea
                    value={row.comment || ""}
                    onChange={(event) => handleRowChange(row.studentId, "comment", event.target.value)}
                    rows={2}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

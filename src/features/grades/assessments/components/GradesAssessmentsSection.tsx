"use client";

import { useLocale, useTranslations } from "next-intl";
import { ClipboardCheck, FileQuestion, Lock, Pencil, Send, ShieldCheck, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { Assessment } from "../types";
import { getAssessmentTypeLabelKey } from "../services/gradesAssessmentsService";

interface GradesAssessmentsSectionProps {
  assessments: Assessment[];
  isReadOnly: boolean;
  isBulkLoading: boolean;
  assessmentActionId: string | null;
  assessmentActionType: "publish" | "approve" | "lock" | "bulk" | "delete" | null;
  onBulkEntry: (assessment: Assessment) => void;
  onPublish: (assessmentId: string) => void;
  onApprove: (assessmentId: string) => void;
  onLock: (assessmentId: string) => void;
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessment: Assessment) => void;
  onManageQuestions: (assessment: Assessment) => void;
}

export default function GradesAssessmentsSection({
  assessments,
  isReadOnly,
  isBulkLoading,
  assessmentActionId,
  assessmentActionType,
  onBulkEntry,
  onPublish,
  onApprove,
  onLock,
  onEdit,
  onDelete,
  onManageQuestions,
}: GradesAssessmentsSectionProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div className="mb-4 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4" style={{ color: "var(--primary-color)" }} />
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("summaryPanel.assessments")}</div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("gradebook.subtitle")}</div>
        </div>
      </div>
      {assessments.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          {t("emptyState.noAssessments")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border px-3 py-3 text-sm" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {locale === "ar" ? assessment.titleAr : assessment.title}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {t(`assessmentTypes.${getAssessmentTypeLabelKey(assessment.type)}`)} · {assessment.weight}% · {assessment.date}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {assessment.approvalStatus === "published" && <Send className="h-4 w-4" style={{ color: "var(--accent-color)" }} />}
                  {assessment.approvalStatus === "approved" && <ShieldCheck className="h-4 w-4" style={{ color: "var(--success-text)" }} />}
                  {assessment.isLocked && <Lock className="h-4 w-4" style={{ color: "var(--warning-text)" }} />}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {assessment.deliveryMode === "QUESTION_BASED" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onManageQuestions(assessment)}
                    leftIcon={<FileQuestion className="h-4 w-4" />}
                  >
                    {t("actions.manageQuestions")}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={assessment.isLocked || isReadOnly}
                  onClick={() => onEdit(assessment)}
                  leftIcon={<Pencil className="h-4 w-4" />}
                >
                  {t("actions.edit")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={
                    assessment.deliveryMode === "QUESTION_BASED" ||
                    assessment.isLocked ||
                    isReadOnly ||
                    isBulkLoading
                  }
                  loading={assessmentActionId === assessment.id && assessmentActionType === "bulk" && isBulkLoading}
                  onClick={() => onBulkEntry(assessment)}
                >
                  {t("actions.bulkEntry")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={assessment.approvalStatus !== "draft" || assessment.isLocked || isReadOnly}
                  loading={assessmentActionId === assessment.id && assessmentActionType === "publish"}
                  onClick={() => onPublish(assessment.id)}
                >
                  {t("actions.publish")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={assessment.approvalStatus !== "published" || assessment.isLocked || isReadOnly}
                  loading={assessmentActionId === assessment.id && assessmentActionType === "approve"}
                  onClick={() => onApprove(assessment.id)}
                >
                  {t("actions.approve")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={assessment.approvalStatus !== "approved" || assessment.isLocked || isReadOnly}
                  loading={assessmentActionId === assessment.id && assessmentActionType === "lock"}
                  onClick={() => onLock(assessment.id)}
                >
                  {t("actions.lock")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={assessment.isLocked || isReadOnly}
                  loading={assessmentActionId === assessment.id && assessmentActionType === "delete"}
                  onClick={() => onDelete(assessment)}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  {t("actions.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

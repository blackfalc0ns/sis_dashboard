"use client";

import { useLocale, useTranslations } from "next-intl";
import { Award, BookOpenCheck, CheckCheck, ClipboardCheck, FileQuestion, Lock, Pencil, Send, ShieldCheck, TrendingUp } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { Assessment } from "../types";
import { getAssessmentTypeLabelKey } from "../../assessments/services/gradesAssessmentsService";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface GradesOverviewSectionProps {
  summary: {
    totalStudents: number;
    totalAssessments: number;
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
    completionRate: number;
  };
  trend: Array<{ label: string; average: number }>;
  gradeRule: { passMark: number } | null;
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
  onManageQuestions: (assessment: Assessment) => void;
}

export default function GradesOverviewSection({
  summary,
  trend,
  gradeRule,
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
  onManageQuestions,
}: GradesOverviewSectionProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={t("kpis.students")} value={summary.totalStudents} icon={BookOpenCheck} iconColor="var(--primary-color)" iconBgColor="var(--color-primary-100)" showChart={false} />
        <KPICardV2 title={t("kpis.assessments")} value={summary.totalAssessments} icon={ClipboardCheck} iconColor="var(--accent-color)" iconBgColor="var(--color-primary-50)" showChart={false} />
        <KPICardV2 title={t("kpis.classAverage")} value={formatPercent(summary.classAverage)} icon={Award} iconColor="var(--success-text)" iconBgColor="var(--success-bg)" showChart={false} />
        <KPICardV2 title={t("kpis.completionRate")} value={formatPercent(summary.completionRate)} icon={CheckCheck} iconColor="var(--warning-text)" iconBgColor="var(--warning-bg)" showChart={false} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4">
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("trend.title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("trend.subtitle")}</div>
          </div>
          {trend.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              {t("emptyState.noAssessments")}
            </div>
          ) : (
            <LineChart
              xAxis={[{ scaleType: "point", data: trend.map((point) => point.label) }]}
              series={[{ data: trend.map((point) => point.average), label: t("trend.average"), color: "var(--primary-color)", curve: "linear" }]}
              height={280}
              margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
            />
          )}
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: "var(--primary-color)" }} />
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("summaryPanel.title")}</div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.highest")}</span>
              <span className="font-semibold">{formatPercent(summary.highestAverage)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.lowest")}</span>
              <span className="font-semibold">{formatPercent(summary.lowestAverage)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{t("summaryPanel.passMark")}</span>
              <span className="font-semibold">{gradeRule?.passMark ?? 50}%</span>
            </div>
          </div>
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("summaryPanel.assessments")}</div>
            <div className="space-y-2">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {locale === "ar" ? assessment.titleAr : assessment.title}
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        {t(`assessmentTypes.${getAssessmentTypeLabelKey(assessment.type)}`)} · {assessment.weight}%
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {assessment.approvalStatus === "published" && <Send className="h-4 w-4" style={{ color: "var(--accent-color)" }} />}
                      {assessment.approvalStatus === "approved" && <ShieldCheck className="h-4 w-4" style={{ color: "var(--success-text)" }} />}
                      {assessment.isLocked && <Lock className="h-4 w-4" style={{ color: "var(--warning-text)" }} />}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

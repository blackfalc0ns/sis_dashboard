"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Link2, RefreshCcw, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import {
  getHomeworkGradeSyncStatus,
  linkHomeworkGradeSync,
  syncHomeworkGrades,
} from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkAssignmentUiModel,
  HomeworkGradeSyncStatusUiModel,
} from "@/features/academics/homework/services/homeworkApi.types";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import type { Assessment } from "@/features/grades/shared/types";

interface HomeworkGradeSyncPanelProps {
  homeworkId: string;
  homework: HomeworkAssignmentUiModel;
  isGraded: boolean;
}

export default function HomeworkGradeSyncPanel({
  homeworkId,
  homework,
  isGraded,
}: HomeworkGradeSyncPanelProps) {
  const locale = useLocale();
  const t = useTranslations("academics.homework.gradeSync");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const { hasPermission } = usePermissions();
  const canView =
    hasPermission("homework.assignments.view") &&
    hasPermission("grades.items.view");
  const canLink =
    hasPermission("homework.assignments.manage") &&
    hasPermission("grades.assessments.manage");
  const canSync =
    hasPermission("homework.assignments.manage") &&
    hasPermission("grades.items.manage");
  const { showError, showSuccess } = useToast();
  const [status, setStatus] = useState<HomeworkGradeSyncStatusUiModel | null>(
    null,
  );
  const [gradeAssessmentId, setGradeAssessmentId] = useState("");
  const [assessmentOptions, setAssessmentOptions] = useState<SelectOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!canView) return;
    setIsLoading(true);
    try {
      const nextStatus = await getHomeworkGradeSyncStatus(homeworkId);
      setStatus(nextStatus);
      setGradeAssessmentId(nextStatus.gradeAssessment?.id ?? "");
    } catch (error) {
      showError(t("errors.load", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsLoading(false);
    }
  }, [canView, homeworkId, showError, t, tHomeworkError]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const loadAssessments = useCallback(async () => {
    if (!canView || !homework.academicYearId || !homework.termId) {
      setAssessmentOptions([]);
      setIsLoadingAssessments(false);
      return;
    }
    setIsLoadingAssessments(true);
    try {
      const assessments = await fetchAssessments(
        homework.academicYearId,
        homework.termId,
        {
          scopeType: homework.classroomId ? "classroom" : "school",
          scopeId: homework.classroomId,
          subjectId: homework.subjectId,
        },
      );
      setAssessmentOptions(
        assessments
          .filter(isHomeworkSyncCompatibleAssessment)
          .map((assessment) => assessmentToOption(assessment, locale)),
      );
    } catch (error) {
      showError(
        t("errors.loadAssessments", { message: getHomeworkErrorMessage(error, tHomeworkError) }),
      );
    } finally {
      setIsLoadingAssessments(false);
    }
  }, [
    canView,
    homework.academicYearId,
    homework.classroomId,
    homework.subjectId,
    homework.termId,
    locale,
    showError,
    t,
    tHomeworkError,
  ]);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  const selectOptions = linkedAssessmentOption(status, assessmentOptions);

  const linkAssessment = async () => {
    if (!canLink || !gradeAssessmentId.trim()) return;
    setIsLinking(true);
    try {
      const nextStatus = await linkHomeworkGradeSync(
        homeworkId,
        gradeAssessmentId.trim(),
      );
      setStatus(nextStatus);
      showSuccess(t("messages.linked"));
    } catch (error) {
      showError(t("errors.link", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsLinking(false);
    }
  };

  const syncAll = async () => {
    if (!canSync) return;
    setIsSyncing(true);
    try {
      const nextStatus = await syncHomeworkGrades(homeworkId);
      setStatus(nextStatus);
      showSuccess(t("messages.synced"));
    } catch (error) {
      showError(t("errors.sync", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
    } finally {
      setIsSyncing(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isGraded ? t("description") : t("notGraded")}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadStatus()}
              loading={isLoading}
              leftIcon={<RefreshCcw className="h-4 w-4" />}
            >
              {t("actions.refresh")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("link.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("link.description")}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <Select
                label={t("link.assessmentId")}
                value={gradeAssessmentId}
                onChange={setGradeAssessmentId}
                options={selectOptions}
                placeholder={t("link.placeholder")}
                searchable
                searchPlaceholder={t("link.searchPlaceholder")}
                noOptionsText={
                  isLoadingAssessments
                    ? t("link.loading")
                    : t("link.noAssessments")
                }
                noResultsText={t("link.noResults")}
                disabled={!canLink || isLoadingAssessments}
              />
              {canLink && (
                <Button
                  onClick={() => void linkAssessment()}
                  loading={isLinking}
                  disabled={!gradeAssessmentId.trim()}
                  leftIcon={<Link2 className="h-4 w-4" />}
                >
                  {t("actions.link")}
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("status.title")}
            </h3>
            <div className="mt-4 space-y-3">
              <StatusRow
                label={t("status.linked")}
                value={status?.linked ? t("status.yes") : t("status.no")}
              />
              <StatusRow
                label={t("status.assessment")}
                value={
                  status?.gradeAssessment?.title ||
                  status?.gradeAssessment?.id ||
                  "-"
                }
              />
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t("sync.title")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("sync.description")}
              </p>
            </div>
            {canSync && (
              <Button
                onClick={() => void syncAll()}
                loading={isSyncing}
                disabled={!status?.linked}
                leftIcon={<Send className="h-4 w-4" />}
              >
                {t("actions.syncAll")}
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric
              label={t("summary.total")}
              value={status?.syncSummary?.total}
            />
            <Metric
              label={t("summary.synced")}
              value={status?.syncSummary?.synced}
            />
            <Metric
              label={t("summary.skipped")}
              value={status?.syncSummary?.skipped}
            />
            <Metric
              label={t("summary.failed")}
              value={status?.syncSummary?.failed}
            />
          </div>
        </section>

        {(status?.warnings?.length ?? 0) > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {t("warnings.title")}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              {status?.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function isHomeworkSyncCompatibleAssessment(assessment: Assessment) {
  return (
    assessment.type === "ASSIGNMENT" &&
    assessment.approvalStatus === "published" &&
    !assessment.isLocked
  );
}

function assessmentToOption(
  assessment: Assessment,
  locale: string,
): SelectOption {
  const localizedTitle =
    locale === "ar"
      ? assessment.titleAr || assessment.title
      : assessment.title || assessment.titleAr;
  const label = `${localizedTitle} - ${assessment.maxScore}`;
  return {
    value: assessment.id,
    label,
    searchText: [
      assessment.title,
      assessment.titleAr,
      assessment.type,
      assessment.approvalStatus,
      assessment.deliveryMode,
      assessment.date,
      assessment.id,
    ].join(" "),
  };
}

function linkedAssessmentOption(
  status: HomeworkGradeSyncStatusUiModel | null,
  options: SelectOption[],
) {
  const linkedId = status?.gradeAssessment?.id;
  if (!linkedId || options.some((option) => option.value === linkedId)) {
    return options;
  }
  return [
    {
      value: linkedId,
      label: status?.gradeAssessment?.title || linkedId,
      searchText: linkedId,
    },
    ...options,
  ];
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-gray-50 p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">
        {value ?? 0}
      </div>
    </div>
  );
}

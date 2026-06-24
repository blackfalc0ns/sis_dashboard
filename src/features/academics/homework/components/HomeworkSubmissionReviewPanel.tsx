"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  Clock,
  FileText,
  RefreshCcw,
  Save,
  Search,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { mapHomeworkApiError } from "@/features/academics/homework/services/homeworkErrors";
import {
  bulkReviewHomeworkSubmissionAnswers,
  fetchHomeworkSubmission,
  listHomeworkSubmissionAnswers,
  listHomeworkSubmissionAttachments,
  listHomeworkSubmissions,
  reviewHomeworkSubmission,
  reviewHomeworkSubmissionAnswer,
  syncHomeworkSubmissionGrade,
} from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkSubmissionAnswerUiModel,
  HomeworkSubmissionAttachmentUiModel,
  HomeworkSubmissionListFilters,
  HomeworkSubmissionUiModel,
} from "@/features/academics/homework/services/homeworkApi.types";

interface HomeworkSubmissionReviewPanelProps {
  homeworkId: string;
  totalMarks: number;
}

type ReviewDraft = {
  score: string;
  feedback: string;
};

type SubmissionReviewDraft = {
  awardedMarks: string;
  reviewNote: string;
};

type SubmissionStatusFilter = "all" | NonNullable<HomeworkSubmissionListFilters["status"]>;

function statusClass(status: string) {
  if (status === "reviewed") return "bg-green-100 text-green-700";
  if (status === "submitted") return "bg-blue-100 text-blue-700";
  if (status === "late") return "bg-amber-100 text-amber-700";
  if (status === "draft") return "bg-gray-100 text-gray-700";
  return "bg-slate-100 text-slate-700";
}

function formatMaybeDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString(locale);
}

function scoreText(score?: number, maxScore?: number) {
  if (score === undefined && maxScore === undefined) return "-";
  if (maxScore === undefined) return String(score ?? "-");
  return `${score ?? "-"} / ${maxScore}`;
}

function normalizeStatus(status: string | undefined) {
  return status?.toLowerCase() ?? "submitted";
}

export default function HomeworkSubmissionReviewPanel({
  homeworkId,
  totalMarks,
}: HomeworkSubmissionReviewPanelProps) {
  const locale = useLocale();
  const t = useTranslations("academics.homework.review");
  const { hasPermission } = usePermissions();
  const canView = hasPermission("homework.submissions.view");
  const canManage = hasPermission("homework.assignments.manage");
  const canSync = hasPermission("grades.items.manage");
  const { showError, showSuccess } = useToast();
  const [submissions, setSubmissions] = useState<HomeworkSubmissionUiModel[]>(
    [],
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [answers, setAnswers] = useState<HomeworkSubmissionAnswerUiModel[]>([]);
  const [attachments, setAttachments] = useState<
    HomeworkSubmissionAttachmentUiModel[]
  >([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isSavingSubmissionReview, setIsSavingSubmissionReview] =
    useState(false);
  const [isSyncingSubmission, setIsSyncingSubmission] = useState(false);
  const [submissionReviewDraft, setSubmissionReviewDraft] =
    useState<SubmissionReviewDraft>({
      awardedMarks: "",
      reviewNote: "",
    });
  const [statusFilter, setStatusFilter] =
    useState<SubmissionStatusFilter>("pending_review");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const selectedSubmission = useMemo(
    () =>
      submissions.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ?? null,
    [selectedSubmissionId, submissions],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("filters.statuses.all") },
      { value: "pending_review", label: t("filters.statuses.pendingReview") },
      { value: "submitted", label: t("filters.statuses.submitted") },
      { value: "late", label: t("filters.statuses.late") },
      { value: "reviewed", label: t("filters.statuses.reviewed") },
    ],
    [t],
  );

  const submissionSummary = useMemo(() => {
    return submissions.reduce(
      (summary, submission) => {
        const status = normalizeStatus(submission.status);
        summary.total += 1;
        if (status === "reviewed") summary.reviewed += 1;
        if (status === "submitted" || status === "late") summary.pending += 1;
        if (status === "late" || submission.isLate) summary.late += 1;
        return summary;
      },
      { total: 0, pending: 0, late: 0, reviewed: 0 },
    );
  }, [submissions]);

  const updateSelectedSubmission = useCallback(
    (updated: HomeworkSubmissionUiModel) => {
      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === updated.id ? updated : submission,
        ),
      );
      setSubmissionReviewDraft({
        awardedMarks:
          updated.awardedMarks === undefined ? "" : String(updated.awardedMarks),
        reviewNote: updated.reviewNote ?? "",
      });
    },
    [],
  );

  const loadSubmissions = useCallback(async () => {
    if (!canView) return;
    setIsLoadingSubmissions(true);
    try {
      const filters: HomeworkSubmissionListFilters = {
        limit: 100,
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(appliedSearch.trim() ? { search: appliedSearch.trim() } : {}),
      };
      const nextSubmissions = await listHomeworkSubmissions(homeworkId, filters);
      setSubmissions(nextSubmissions);
      setSelectedSubmissionId((current) =>
        current &&
        nextSubmissions.some((submission) => submission.id === current)
          ? current
          : (nextSubmissions[0]?.id ?? null),
      );
    } catch (error) {
      showError(
        t("errors.loadSubmissions", { code: mapHomeworkApiError(error) }),
      );
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [appliedSearch, canView, homeworkId, showError, statusFilter, t]);

  const loadSubmissionDetail = useCallback(
    async (submissionId: string) => {
      setIsLoadingDetail(true);
      try {
        const [nextSubmission, nextAnswers, nextAttachments] =
          await Promise.all([
            fetchHomeworkSubmission(homeworkId, submissionId),
            listHomeworkSubmissionAnswers(homeworkId, submissionId),
            listHomeworkSubmissionAttachments(homeworkId, submissionId),
          ]);
        updateSelectedSubmission(nextSubmission);
        setAnswers(nextAnswers);
        setAttachments(nextAttachments);
        setDrafts(
          Object.fromEntries(
            nextAnswers.map((answer) => [
              answer.id,
              {
                score: answer.score === undefined ? "" : String(answer.score),
                feedback: answer.feedback ?? "",
              },
            ]),
          ),
        );
      } catch (error) {
        showError(t("errors.loadDetail", { code: mapHomeworkApiError(error) }));
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [homeworkId, showError, t, updateSelectedSubmission],
  );

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!selectedSubmissionId || !canView) return;
    void loadSubmissionDetail(selectedSubmissionId);
  }, [canView, loadSubmissionDetail, selectedSubmissionId]);

  const updateDraft = (answerId: string, updates: Partial<ReviewDraft>) => {
    setDrafts((current) => ({
      ...current,
      [answerId]: {
        score: current[answerId]?.score ?? "",
        feedback: current[answerId]?.feedback ?? "",
        ...updates,
      },
    }));
  };

  const applySearch = () => {
    setAppliedSearch(searchDraft.trim());
  };

  const saveAnswerReview = async (answerId: string) => {
    if (!selectedSubmissionId || !canManage) return;
    const draft = drafts[answerId];
    const parsedScore = draft?.score.trim() ? Number(draft.score) : undefined;
    setPendingAnswerId(answerId);
    try {
      const updated = await reviewHomeworkSubmissionAnswer(
        homeworkId,
        selectedSubmissionId,
        answerId,
        {
          score: Number.isFinite(parsedScore) ? parsedScore : undefined,
          feedback: draft?.feedback,
        },
      );
      setAnswers((current) =>
        current.map((answer) => (answer.id === answerId ? updated : answer)),
      );
      showSuccess(t("messages.answerSaved"));
    } catch (error) {
      showError(t("errors.saveAnswer", { code: mapHomeworkApiError(error) }));
    } finally {
      setPendingAnswerId(null);
    }
  };

  const saveAllReviews = async () => {
    if (!selectedSubmissionId || !canManage) return;
    const reviewItems = answers.map((answer) => {
      const draft = drafts[answer.id];
      const parsedScore = draft?.score.trim() ? Number(draft.score) : undefined;
      return {
        answerId: answer.id,
        score: Number.isFinite(parsedScore) ? parsedScore : undefined,
        feedback: draft?.feedback,
      };
    });
    setIsBulkSaving(true);
    try {
      const updatedAnswers = await bulkReviewHomeworkSubmissionAnswers(
        homeworkId,
        selectedSubmissionId,
        { answers: reviewItems },
      );
      setAnswers(updatedAnswers);
      showSuccess(t("messages.allSaved"));
    } catch (error) {
      showError(t("errors.saveAll", { code: mapHomeworkApiError(error) }));
    } finally {
      setIsBulkSaving(false);
    }
  };

  const saveSubmissionReview = async () => {
    if (!selectedSubmissionId || !canManage) return;
    const parsedMarks = submissionReviewDraft.awardedMarks.trim()
      ? Number(submissionReviewDraft.awardedMarks)
      : undefined;
    setIsSavingSubmissionReview(true);
    try {
      const updated = await reviewHomeworkSubmission(
        homeworkId,
        selectedSubmissionId,
        {
          awardedMarks: Number.isFinite(parsedMarks) ? parsedMarks : undefined,
          reviewNote: submissionReviewDraft.reviewNote,
        },
      );
      updateSelectedSubmission(updated);
      showSuccess(t("messages.submissionSaved"));
    } catch (error) {
      showError(
        t("errors.saveSubmission", { code: mapHomeworkApiError(error) }),
      );
    } finally {
      setIsSavingSubmissionReview(false);
    }
  };

  const syncSelectedSubmission = async () => {
    if (!selectedSubmissionId || !canSync) return;
    setIsSyncingSubmission(true);
    try {
      await syncHomeworkSubmissionGrade(homeworkId, selectedSubmissionId);
      showSuccess(t("messages.synced"));
      await loadSubmissions();
    } catch (error) {
      showError(t("errors.sync", { code: mapHomeworkApiError(error) }));
    } finally {
      setIsSyncingSubmission(false);
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
    <div className="space-y-4 p-4 lg:p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label={t("summary.visible")} value={submissionSummary.total} />
        <SummaryCard label={t("summary.pending")} value={submissionSummary.pending} />
        <SummaryCard label={t("summary.late")} value={submissionSummary.late} />
        <SummaryCard label={t("summary.reviewed")} value={submissionSummary.reviewed} />
      </div>

      <div className="grid min-h-[calc(100vh-270px)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-white">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {t("submissions.title")}
                </h2>
                <p className="text-xs text-gray-500">
                  {t("submissions.count", { count: submissions.length })}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadSubmissions()}
                loading={isLoadingSubmissions}
                leftIcon={<RefreshCcw className="h-4 w-4" />}
              >
                {t("actions.refresh")}
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <Select
                label={t("filters.status")}
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => setStatusFilter(value as SubmissionStatusFilter)}
                selectSize="sm"
              />
              <div className="flex gap-2">
                <Input
                  label={t("filters.search")}
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applySearch();
                  }}
                  placeholder={t("filters.searchPlaceholder")}
                  inputSize="sm"
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applySearch}
                  >
                    {t("actions.search")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="max-h-[calc(100vh-410px)] overflow-y-auto p-2">
          {!isLoadingSubmissions && submissions.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              {t("submissions.empty")}
            </div>
          )}
          {submissions.map((submission) => (
            <button
              key={submission.id}
              type="button"
              onClick={() => setSelectedSubmissionId(submission.id)}
              className={`mb-2 w-full rounded-lg border border-border p-3 text-left transition hover:border-primary ${
                selectedSubmissionId === submission.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {submission.studentName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatMaybeDate(submission.submittedAt, locale)}
                  </div>
                  {submission.studentNumber && (
                    <div className="mt-1 text-xs text-gray-400">
                      {submission.studentNumber}
                    </div>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(
                    submission.status,
                  )}`}
                >
                  {submission.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {scoreText(
                  submission.awardedMarks,
                  submission.totalMarks ?? totalMarks,
                )}
              </div>
              {submission.isLate && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3" />
                  {t("submissions.late")}
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 rounded-lg border border-border bg-white">
        {!selectedSubmission ? (
          <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-gray-500">
            {t("detail.selectSubmission")}
          </div>
        ) : (
          <>
            <div className="border-b border-border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedSubmission.studentName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t("detail.submittedAt", {
                      date: formatMaybeDate(
                        selectedSubmission.submittedAt,
                        locale,
                      ),
                    })}
                  </p>
                  {selectedSubmission.studentNumber && (
                    <p className="text-xs text-gray-400">
                      {selectedSubmission.studentNumber}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void saveAllReviews()}
                      loading={isBulkSaving}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      {t("actions.saveAll")}
                    </Button>
                  )}
                  {canSync && (
                    <Button
                      size="sm"
                      onClick={() => void syncSelectedSubmission()}
                      loading={isSyncingSubmission}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {t("actions.syncSubmission")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  {t("detail.loading")}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryItem
                      label={t("detail.status")}
                      value={selectedSubmission.status}
                    />
                    <SummaryItem
                      label={t("detail.reviewedAt")}
                      value={formatMaybeDate(
                        selectedSubmission.reviewedAt,
                        locale,
                      )}
                    />
                    <SummaryItem
                      label={t("detail.score")}
                      value={scoreText(
                        selectedSubmission.awardedMarks,
                        selectedSubmission.totalMarks ?? totalMarks,
                      )}
                    />
                  </div>

                  {selectedSubmission.bodyText && (
                    <div className="rounded-lg border border-border bg-gray-50 p-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("detail.bodyText")}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {selectedSubmission.bodyText}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("submissionReview.title")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {t("submissionReview.description")}
                      </p>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-end">
                      <Input
                        label={t("submissionReview.awardedMarks")}
                        type="number"
                        min={0}
                        max={selectedSubmission.totalMarks ?? totalMarks}
                        step="0.01"
                        value={submissionReviewDraft.awardedMarks}
                        onChange={(event) =>
                          setSubmissionReviewDraft((current) => ({
                            ...current,
                            awardedMarks: event.target.value,
                          }))
                        }
                        disabled={!canManage}
                      />
                      <TextArea
                        label={t("submissionReview.reviewNote")}
                        value={submissionReviewDraft.reviewNote}
                        rows={2}
                        resize="vertical"
                        onChange={(event) =>
                          setSubmissionReviewDraft((current) => ({
                            ...current,
                            reviewNote: event.target.value,
                          }))
                        }
                        disabled={!canManage}
                      />
                      {canManage && (
                        <Button
                          onClick={() => void saveSubmissionReview()}
                          loading={isSavingSubmissionReview}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {t("actions.saveSubmission")}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t("answers.title")}
                    </h3>
                    {answers.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                        {t("answers.empty")}
                      </div>
                    )}
                    {answers.map((answer) => (
                      <article
                        key={answer.id}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {answer.prompt}
                            </div>
                            <div className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                              {answer.answerText || t("answers.noAnswer")}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {scoreText(answer.score, answer.maxScore)}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-end">
                          <Input
                            label={t("answers.score")}
                            type="number"
                            min={0}
                            max={answer.maxScore}
                            value={drafts[answer.id]?.score ?? ""}
                            onChange={(event) =>
                              updateDraft(answer.id, {
                                score: event.target.value,
                              })
                            }
                            disabled={!canManage}
                          />
                          <TextArea
                            label={t("answers.feedback")}
                            value={drafts[answer.id]?.feedback ?? ""}
                            rows={2}
                            resize="vertical"
                            onChange={(event) =>
                              updateDraft(answer.id, {
                                feedback: event.target.value,
                              })
                            }
                            disabled={!canManage}
                          />
                          {canManage && (
                            <Button
                              variant="secondary"
                              onClick={() => void saveAnswerReview(answer.id)}
                              loading={pendingAnswerId === answer.id}
                              leftIcon={<Save className="h-4 w-4" />}
                            >
                              {t("actions.saveAnswer")}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t("attachments.title")}
                    </h3>
                    {attachments.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                        {t("attachments.empty")}
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      {attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url || "#"}
                          target={attachment.url ? "_blank" : undefined}
                          rel="noreferrer"
                          className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm hover:border-primary"
                        >
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-900">
                              {attachment.title}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {attachment.filename ||
                                attachment.mimeType ||
                                "-"}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-gray-50 p-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

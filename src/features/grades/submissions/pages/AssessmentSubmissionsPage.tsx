"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { listAssessmentSubmissions } from "../services/gradesSubmissionsService";
import type { GradeSubmissionRow, SubmissionStatus } from "../types";
import { submissionStatusMessageKey } from "../utils/submissionStatus";

export default function AssessmentSubmissionsPage({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("academics.grades.submissions");
  const errorT = useTranslations("academics.grades.errors");
  const locale = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState<GradeSubmissionRow[]>([]);
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAssessmentSubmissions(assessmentId, {
        status: status || undefined,
        search: search || undefined,
      });
      if (!signal.aborted) setRows(response.items);
    } catch (requestError) {
      if (!signal.aborted) setError(errorT(mapGradesApiError(requestError)));
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [assessmentId, errorT, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSubmissions(controller.signal);
    return () => controller.abort();
  }, [loadSubmissions]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t("title")}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3 border-y border-[var(--border-color)] py-4 md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute start-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
          <input className="h-10 w-full border border-[var(--border-color)] bg-[var(--surface-color)] ps-9 pe-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search")} />
        </label>
        <select className="h-10 border border-[var(--border-color)] bg-[var(--surface-color)] px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SubmissionStatus | "")}>
          <option value="">{t("allStatuses")}</option>
          {(["in_progress", "submitted", "corrected"] as const).map((value) => <option key={value} value={value}>{t(`statuses.${submissionStatusMessageKey(value)}`)}</option>)}
        </select>
      </div>
      {isLoading ? <div className="py-12 text-center text-sm text-[var(--text-secondary)]">{t("loading")}</div> : null}
      {error ? <div className="border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error-text)]">{error}</div> : null}
      {!isLoading && !error && rows.length === 0 ? <div className="border border-[var(--border-color)] p-10 text-center text-sm text-[var(--text-secondary)]">{t("empty")}</div> : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto border border-[var(--border-color)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[var(--surface-secondary)] text-start text-[var(--text-secondary)]"><tr><th className="p-3 text-start">{t("student")}</th><th className="p-3 text-start">{t("class")}</th><th className="p-3 text-start">{t("status")}</th><th className="p-3 text-start">{t("progress")}</th><th className="p-3 text-start">{t("pending")}</th><th className="p-3" /></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--border-color)]"><td className="p-3 font-medium">{locale === "ar" ? row.student?.nameAr || row.student?.nameEn : row.student?.nameEn}</td><td className="p-3">{row.enrollment?.classroomName || "-"}</td><td className="p-3">{t(`statuses.${submissionStatusMessageKey(row.status)}`)}</td><td className="p-3">{row.progress.answeredCount}/{row.progress.totalQuestions}</td><td className="p-3">{row.progress.pendingCorrectionCount}</td><td className="p-3 text-end"><Button size="sm" variant="secondary" onClick={() => router.push(`/${locale}/grades/submissions/${row.id}`)}>{t("open")}</Button></td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

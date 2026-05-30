"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementFilterToolbar, {
  type ActiveFilter,
  type FilterConfig,
} from "../components/shared/ReinforcementFilterToolbar";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import {
  approveReinforcementSubmission,
  listReinforcementReviewQueue,
  rejectReinforcementSubmission,
} from "../services/reinforcementReviewsService";
import type {
  ReinforcementReviewItem,
  ReinforcementReviewStatus,
} from "../types";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE_STYLES: Record<ReinforcementReviewStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ReinforcementReviewQueuePage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  // Note: debounceKey is not used here because ReinforcementFilterToolbar
  // handles search debounce internally before calling onChange
  const {
    values,
    setValue,
    clearAll,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useReinforcementUrlFilters({
    paramKeys: ["status", "search", "academicYearId", "termId", "stageId", "gradeId", "sectionId", "classroomId"],
    defaults: {},
  });

  // ─── Academic context derived from URL params ────────────────────────────
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
    }),
    [values.academicYearId, values.termId, values.stageId, values.gradeId, values.sectionId, values.classroomId],
  );

  const [items, setItems] = useState<ReinforcementReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.reviews.view");
  const canManage = hasPermission("reinforcement.reviews.manage");

  // ─── Filter toolbar config ───────────────────────────────────────────────
  const reviewQueueFilters: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reviews.table.status"),
        type: "select",
        options: [
          { value: "", label: t("filters.allStatuses") },
          { value: "submitted", label: t("reviews.status.submitted") },
          { value: "approved", label: t("reviews.status.approved") },
          { value: "rejected", label: t("reviews.status.rejected") },
        ],
      },
      {
        key: "search",
        label: t("filters.search"),
        type: "search",
        placeholder: t("filters.searchPlaceholder"),
      },
    ],
    [t],
  );

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    if (values.status) {
      filters.push({
        key: "status",
        label: t("reviews.table.status"),
        value: values.status,
        displayValue: t(`reviews.status.${values.status}`),
      });
    }
    if (values.search) {
      filters.push({
        key: "search",
        label: t("filters.search"),
        value: values.search,
        displayValue: values.search,
      });
    }
    return filters;
  }, [values.status, values.search, t]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setValue(key, value);
    },
    [setValue],
  );

  const handleClearAllFilters = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleRemoveFilter = useCallback(
    (key: string) => {
      setValue(key, "");
    },
    [setValue],
  );

  const params = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      classroomId: values.classroomId || undefined,
      status: values.status || undefined,
      search: values.search || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [values.academicYearId, values.termId, values.classroomId, values.status, values.search, page, pageSize],
  );

  const refreshQueue = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listReinforcementReviewQueue(params);
      setItems(response.items);
      setTotal(response.total ?? response.items.length);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setItems([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshQueue);
  }, [refreshQueue]);

  const handleApprove = useCallback(
    async (item: ReinforcementReviewItem) => {
      try {
        await approveReinforcementSubmission(item.id, {});
        showSuccess(t("reviews.messages.approved"));
        await refreshQueue();
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : t("reviews.messages.error");
        showError(message);
      }
    },
    [refreshQueue, showSuccess, showError, t],
  );

  const handleReject = useCallback(
    async (item: ReinforcementReviewItem) => {
      try {
        await rejectReinforcementSubmission(item.id, {});
        showSuccess(t("reviews.messages.rejected"));
        await refreshQueue();
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : t("reviews.messages.error");
        showError(message);
      }
    },
    [refreshQueue, showSuccess, showError, t],
  );

  const columns: Column<ReinforcementReviewItem>[] = useMemo(
    () => [
      {
        key: "student",
        label: t("reviews.table.student"),
        searchable: true,
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const student = row.student as Record<string, unknown>;
          const name =
            locale === "ar"
              ? (student?.nameAr as string) || (student?.name as string) || "-"
              : (student?.name as string) || (student?.nameEn as string) || "-";
          return <span className="font-medium text-gray-900">{name}</span>;
        },
      },
      {
        key: "task",
        label: t("reviews.table.task"),
        searchable: true,
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const task = row.task as Record<string, unknown>;
          const title =
            locale === "ar"
              ? (task?.titleAr as string) || (task?.titleEn as string) || "-"
              : (task?.titleEn as string) || (task?.titleAr as string) || "-";
          return <span className="text-gray-700">{title}</span>;
        },
      },
      {
        key: "stage",
        label: t("reviews.table.stage"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const stage = row.stage as Record<string, unknown>;
          const title =
            locale === "ar"
              ? (stage?.titleAr as string) || (stage?.titleEn as string) || "-"
              : (stage?.titleEn as string) || (stage?.titleAr as string) || "-";
          return <span className="text-gray-700">{title}</span>;
        },
      },
      {
        key: "status",
        label: t("reviews.table.status"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const reviewStatus = row.status as ReinforcementReviewStatus;
          const badgeClass =
            STATUS_BADGE_STYLES[reviewStatus] || "bg-gray-100 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`reviews.status.${reviewStatus}`)}
            </span>
          );
        },
      },
      {
        key: "submittedAt",
        label: t("reviews.table.submittedAt"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          if (!row.submittedAt) return <span className="text-gray-400">-</span>;
          return (
            <span className="text-gray-700">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                dateStyle: "medium",
              }).format(new Date(row.submittedAt))}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: t("reviews.table.actions"),
        render: (_value: unknown, row: ReinforcementReviewItem) => (
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/reinforcement/reviews/${row.id}`}>
              <Button variant="secondary" size="sm">
                {t("reviews.actions.viewDetail")}
              </Button>
            </Link>
            {canManage && row.status === "submitted" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                  onClick={() => handleApprove(row)}
                >
                  {t("reviews.actions.approve")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={() => handleReject(row)}
                >
                  {t("reviews.actions.reject")}
                </Button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [locale, t, canManage, handleApprove, handleReject],
  );

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("reviews.title")}
        description={t("reviews.description")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={refreshQueue}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("filters.title")}
        </h2>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={context}
            showSubject={false}
            showStudent={false}
            onChange={(selection: ReinforcementAcademicContextSelection) => {
              setValue("academicYearId", selection.academicYearId || "");
              setValue("termId", selection.termId || "");
              setValue("stageId", selection.stageId || "");
              setValue("gradeId", selection.gradeId || "");
              setValue("sectionId", selection.sectionId || "");
              setValue("classroomId", selection.classroomId || "");
            }}
          />
        </div>
      </section>

      <ReinforcementFilterToolbar
        filters={reviewQueueFilters}
        values={{ status: values.status, search: values.search }}
        onChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        searchKey="search"
        debounceMs={350}
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <DataTable<ReinforcementReviewItem>
          columns={columns}
          data={items}
          searchQuery={values.search}
          serverPagination={{
            enabled: true,
            currentPage: page,
            pageSize,
            totalItems: total,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </section>
    </div>
  );
}

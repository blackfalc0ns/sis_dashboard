"use client";

import { useLocale } from "next-intl";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import ReportFilters from "@/features/communication/components/safety/ReportFilters";
import ReportsTable from "@/features/communication/components/safety/ReportsTable";
import { useMessageReports } from "@/features/communication/hooks/useMessageReports";

const labels = {
  en: {
    title: "Safety Reports",
    description:
      "Review message reports, triage open cases, and track moderation outcomes.",
    refresh: "Refresh",
    loading: "Loading reports...",
    errorTitle: "Unable to load reports",
    retry: "Retry",
    status: "Status",
    open: "Open",
    inReview: "In review",
    resolved: "Resolved",
    reason: "Reason",
    reasonPlaceholder: "Filter by reason",
    clear: "Clear",
    emptyTitle: "No reports found",
    emptyDescription:
      "There are no message reports for this filter. New reports will appear here.",
    report: "Report",
    reporter: "Reporter",
    createdAt: "Created",
    view: "View",
    unknown: "Unknown",
    countLabel: "report",
    countLabelPlural: "reports",
  },
  ar: {
    title: "بلاغات الأمان",
    description: "راجع بلاغات الرسائل وفرز الحالات المفتوحة وتتبع قرارات الإشراف.",
    refresh: "تحديث",
    loading: "جار تحميل البلاغات...",
    errorTitle: "تعذر تحميل البلاغات",
    retry: "إعادة المحاولة",
    status: "الحالة",
    open: "مفتوح",
    inReview: "قيد المراجعة",
    resolved: "محلول",
    reason: "السبب",
    reasonPlaceholder: "تصفية حسب السبب",
    clear: "مسح",
    emptyTitle: "لا توجد بلاغات",
    emptyDescription: "لا توجد بلاغات رسائل لهذا المرشح. ستظهر البلاغات الجديدة هنا.",
    report: "البلاغ",
    reporter: "المبلغ",
    createdAt: "تاريخ الإنشاء",
    view: "عرض",
    unknown: "غير معروف",
    countLabel: "بلاغ",
    countLabelPlural: "بلاغات",
  },
};

type LocaleKey = keyof typeof labels;

export default function MessageReportsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const {
    error,
    filters,
    isLoading,
    isRefreshing,
    refresh,
    reports,
    setFilters,
    total,
  } = useMessageReports();

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            type="button"
            variant="secondary"
            loading={isRefreshing}
            onClick={() => void refresh()}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {t.refresh}
          </Button>
        }
      />
      <CommunicationTabs />

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        labels={{
          status: t.status,
          open: t.open,
          inReview: t.inReview,
          resolved: t.resolved,
          reason: t.reason,
          reasonPlaceholder: t.reasonPlaceholder,
          clear: t.clear,
        }}
      />

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="text-sm text-slate-500">
        {total} {total === 1 ? t.countLabel : t.countLabelPlural}
      </div>

      <ReportsTable
        reports={reports}
        locale={locale}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          report: t.report,
          reporter: t.reporter,
          reason: t.reason,
          status: t.status,
          createdAt: t.createdAt,
          open: t.open,
          inReview: t.inReview,
          resolved: t.resolved,
          view: t.view,
          unknown: t.unknown,
        }}
      />
    </div>
  );
}

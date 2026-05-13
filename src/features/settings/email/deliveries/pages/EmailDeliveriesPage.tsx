"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, RefreshCcw, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import DeliveryBatchTable from "@/features/settings/email/deliveries/components/DeliveryBatchTable";
import {
  cancelEmailDeliveryBatch,
  fetchEmailDeliveries,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  EmailDeliveryBatch,
  EmailDeliveryKind,
  EmailDeliveryStatus,
  FetchEmailDeliveriesParams,
} from "@/features/settings/email/deliveries/types";

export default function EmailDeliveriesPage() {
  const t = useTranslations("settings.email.deliveries");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.security.manage");
  const [batches, setBatches] = useState<EmailDeliveryBatch[]>([]);
  const [kind, setKind] = useState<EmailDeliveryKind | "all">("all");
  const [status, setStatus] = useState<EmailDeliveryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingBatchId, setCancellingBatchId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const kindLabels = useMemo(
    () => ({
      CREDENTIAL_DELIVERY: t("kinds.CREDENTIAL_DELIVERY"),
      GENERAL_CAMPAIGN: t("kinds.GENERAL_CAMPAIGN"),
    }),
    [t],
  );

  const statusLabels = useMemo(
    () => ({
      DRAFT: t("statuses.DRAFT"),
      QUEUED: t("statuses.QUEUED"),
      PROCESSING: t("statuses.PROCESSING"),
      SUCCEEDED: t("statuses.SUCCEEDED"),
      PARTIAL_FAILED: t("statuses.PARTIAL_FAILED"),
      FAILED: t("statuses.FAILED"),
      CANCELLED: t("statuses.CANCELLED"),
    }),
    [t],
  );

  const fetchParams = useMemo<FetchEmailDeliveriesParams>(
    () => ({
      kind,
      status,
      page,
      limit,
    }),
    [kind, limit, page, status],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      try {
        const result = await fetchEmailDeliveries(fetchParams);
        setBatches(result.items);
        setTotal(result.pagination?.total || result.items.length);
        setPage(result.pagination?.page || page);
        setLimit(result.pagination?.limit || limit);
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t("messages.load_failed");
        setPageError(message);
        showError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchParams, limit, page, showError, t],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setPage(1);
  }, [kind, status]);

  const handleCancel = async (batch: EmailDeliveryBatch) => {
    if (!canManage || !batch.cancellable) {
      return;
    }
    setCancellingBatchId(batch.batchId);
    try {
      await cancelEmailDeliveryBatch(batch.batchId);
      showSuccess(t("messages.cancelled"));
      await hydrate("refresh");
    } catch (error) {
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setCancellingBatchId(null);
    }
  };

  const clearFilters = () => {
    setKind("all");
    setStatus("all");
    setPage(1);
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.security.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<Filter className="h-4 w-4" />}
                onClick={() => setShowFilters((current) => !current)}
              >
                {t("filters.button")}
              </Button>
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isRefreshing}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
            </div>
          }
        />

        {pageError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pageError}
          </p>
        ) : null}

        {showFilters ? (
          <div className="mb-6">
            <SettingsSectionCard
              title={t("filters.title")}
              description={t("filters.description")}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
                <Select
                  label={t("filters.kind")}
                  value={kind}
                  onChange={(value) => setKind(value as EmailDeliveryKind | "all")}
                  options={[
                    { value: "all", label: t("filters.all") },
                    {
                      value: "CREDENTIAL_DELIVERY",
                      label: kindLabels.CREDENTIAL_DELIVERY,
                    },
                    {
                      value: "GENERAL_CAMPAIGN",
                      label: kindLabels.GENERAL_CAMPAIGN,
                    },
                  ]}
                />
                <Select
                  label={t("filters.status")}
                  value={status}
                  onChange={(value) =>
                    setStatus(value as EmailDeliveryStatus | "all")
                  }
                  options={[
                    { value: "all", label: t("filters.all") },
                    ...Object.entries(statusLabels).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={clearFilters}
                  >
                    {t("filters.clear")}
                  </Button>
                </div>
              </div>
            </SettingsSectionCard>
          </div>
        ) : null}

        <SettingsSectionCard
          title={t("table.title")}
          description={t("table.description")}
        >
          {batches.length > 0 ? (
            <DeliveryBatchTable
              batches={batches}
              page={page}
              limit={limit}
              total={total}
              canManage={canManage}
              isCancellingBatchId={cancellingBatchId}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              onCancel={handleCancel}
              labels={{
                kind: t("table.kind"),
                status: t("table.status"),
                subject: t("table.subject"),
                total: t("table.total"),
                queued: t("table.queued"),
                sent: t("table.sent"),
                failed: t("table.failed"),
                skipped: t("table.skipped"),
                cancelled: t("table.cancelled"),
                createdAt: t("table.created_at"),
                actions: t("table.actions"),
                view: t("actions.view"),
                cancel: t("actions.cancel"),
                notAvailable: t("not_available"),
                kindLabels,
                statusLabels,
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("empty.description")}
              </p>
            </div>
          )}
        </SettingsSectionCard>
      </main>
    </SettingsAccessGuard>
  );
}

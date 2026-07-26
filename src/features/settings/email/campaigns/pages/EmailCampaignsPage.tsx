"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { DataTable } from "@/components/ui";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import CampaignComposer, {
  buildCreateCampaignPayload,
  buildCampaignRecipientScope,
  buildPreviewCampaignPayload,
  type CampaignComposerValues,
} from "@/features/settings/email/campaigns/components/CampaignComposer";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import {
  createEmailCampaign,
  fetchEmailCampaigns,
  previewEmailCampaign,
  previewEmailCampaignRecipients,
} from "@/features/settings/email/campaigns/services/emailCampaignsService";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  CreateEmailCampaignResponse,
  EmailCampaignBatch,
  EmailCampaignPreviewRecipientsResponse,
  EmailCampaignPreviewResponse,
  FetchEmailCampaignsParams,
} from "@/features/settings/email/campaigns/types";
import type { EmailDeliveryStatus } from "@/features/settings/email/deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function EmailCampaignsPage() {
  const t = useTranslations("settings.email.campaigns");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.email.campaigns.manage");
  const [campaigns, setCampaigns] = useState<EmailCampaignBatch[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [status, setStatus] = useState<EmailDeliveryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [recipientPreview, setRecipientPreview] =
    useState<EmailCampaignPreviewRecipientsResponse | null>(null);
  const [renderedPreview, setRenderedPreview] =
    useState<EmailCampaignPreviewResponse | null>(null);
  const [createdBatch, setCreatedBatch] =
    useState<CreateEmailCampaignResponse | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewingRecipients, setIsPreviewingRecipients] = useState(false);
  const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const fetchParams = useMemo<FetchEmailCampaignsParams>(
    () => ({ status, page, limit }),
    [limit, page, status],
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
        const [campaignResult, roleResult] = await Promise.all([
          fetchEmailCampaigns(fetchParams),
          fetchSettingsRoles({ limit: 100 }),
        ]);
        setCampaigns(campaignResult.items);
        setTotal(
          campaignResult.pagination?.total || campaignResult.items.length,
        );
        setPage(campaignResult.pagination?.page || page);
        setLimit(campaignResult.pagination?.limit || limit);
        setRoles(roleResult.items);
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
    void Promise.resolve().then(() => hydrate("refresh"));
  }, [hydrate]);

  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [status]);

  const handlePreviewRecipients = async (values: CampaignComposerValues) => {
    setIsPreviewingRecipients(true);
    setPageError(null);
    setCreatedBatch(null);
    try {
      const result = await previewEmailCampaignRecipients({
        recipientScope: buildCampaignRecipientScope(values),
        customEmails: values.audience.customEmails,
      });
      setRecipientPreview(result);
      showSuccess(t("messages.preview_recipients_ready"));
      return result;
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : t("messages.preview_recipients_failed");
      setPageError(message);
      showError(message);
      return null;
    } finally {
      setIsPreviewingRecipients(false);
    }
  };

  const handlePreviewCampaign = async (values: CampaignComposerValues) => {
    setIsPreviewingCampaign(true);
    setPageError(null);
    try {
      const result = await previewEmailCampaign(
        buildPreviewCampaignPayload(values),
      );
      setRenderedPreview(result);
      showSuccess(t("messages.preview_ready"));
      return result;
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : t("messages.preview_failed");
      setPageError(message);
      showError(message);
      return null;
    } finally {
      setIsPreviewingCampaign(false);
    }
  };

  const handleCreate = async (values: CampaignComposerValues) => {
    if (!canManage) {
      return null;
    }
    setIsCreating(true);
    setPageError(null);
    try {
      const result = await createEmailCampaign(
        buildCreateCampaignPayload(values),
      );
      setCreatedBatch(result);
      setRecipientPreview(null);
      showSuccess(t("messages.created"));
      await hydrate("refresh");
      return result;
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : tCommon("save_failed");
      setPageError(message);
      showError(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "status",
        label: t("table.status"),
        render: (value: unknown) => {
          const batchStatus = value as EmailDeliveryStatus;
          return (
            <DeliveryStatusBadge
              status={batchStatus}
              label={statusLabels[batchStatus] || batchStatus}
            />
          );
        },
      },
      {
        key: "subject",
        label: t("table.subject"),
        searchable: true,
        render: (value: unknown, row: Record<string, unknown>) => {
          const batch = row as unknown as EmailCampaignBatch;
          return (
            <div className="min-w-56">
              <p className="font-medium text-gray-900">
                {String(value || batch.title || t("not_available"))}
              </p>
              <p className="mt-1 break-all text-xs text-gray-500">
                {batch.batchId}
              </p>
            </div>
          );
        },
      },
      { key: "totalRecipients", label: t("table.total") },
      { key: "sentCount", label: t("table.sent") },
      { key: "failedCount", label: t("table.failed") },
      { key: "skippedCount", label: t("table.skipped") },
      {
        key: "createdAt",
        label: t("table.created_at"),
        render: (value: unknown) =>
          formatDate(value as string | null | undefined, t("not_available")),
      },
      {
        key: "batchId",
        label: t("table.actions"),
        sortable: false,
        render: (value: unknown) => {
          const batchId = String(value);
          return (
            <Link href={`/${locale}/settings/email/campaigns/${batchId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={t("actions.view")}
                aria-label={t("actions.view")}
              >
                <Eye className="h-4 w-4 text-info" />
              </Button>
            </Link>
          );
        },
      },
    ],
    [locale, statusLabels, t],
  );

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.campaigns.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              loading={isRefreshing}
              onClick={() => void hydrate("refresh")}
            >
              {t("refresh")}
            </Button>
          }
        />

        {pageError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pageError}
          </p>
        ) : null}

        <CampaignComposer
          canManage={canManage}
          roles={roles}
          recipientPreview={recipientPreview}
          renderedPreview={renderedPreview}
          createdBatch={createdBatch}
          isPreviewingRecipients={isPreviewingRecipients}
          isPreviewingCampaign={isPreviewingCampaign}
          isCreating={isCreating}
          onPreviewRecipients={handlePreviewRecipients}
          onPreviewCampaign={handlePreviewCampaign}
          onCreate={handleCreate}
        />

        <div className="mt-6">
          <SettingsSectionCard
            title={t("list.title")}
            description={t("list.description")}
            actions={
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
                fullWidth={false}
              />
            }
          >
            {campaigns.length > 0 || isRefreshing ? (
              <DataTable
                columns={columns}
                data={campaigns as unknown as Record<string, unknown>[]}
                isLoading={isRefreshing}
                showPagination
                itemsPerPage={limit}
                serverPagination={{
                  enabled: true,
                  currentPage: page,
                  pageSize: limit,
                  totalItems: total,
                  onPageChange: setPage,
                  onPageSizeChange: (nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  },
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <p className="font-semibold text-gray-900">
                  {t("empty.title")}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {t("empty.description")}
                </p>
              </div>
            )}
          </SettingsSectionCard>
        </div>
      </main>
    </SettingsAccessGuard>
  );
}

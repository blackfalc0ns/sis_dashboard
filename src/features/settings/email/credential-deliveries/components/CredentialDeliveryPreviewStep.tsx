"use client";

import Button from "@/components/ui/button/Button";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { useTranslations } from "next-intl";
import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type {
  CredentialDeliveryPreviewRecipient,
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";

interface CredentialDeliveryPreviewStepProps {
  values: CredentialDeliveryWizardValues;
  preview: CredentialDeliveryPreviewResponse | null;
  isPreviewing: boolean;
  onPreview: () => Promise<void>;
}

function RecipientList({
  recipients,
  emptyLabel,
  showReason,
}: {
  recipients: CredentialDeliveryPreviewRecipient[];
  emptyLabel: string;
  showReason?: boolean;
}) {
  if (recipients.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {recipients.map((recipient) => (
        <div
          key={`${recipient.userId}-${recipient.eligible ? "eligible" : "skipped"}`}
          className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {recipient.fullName}
              </p>
              <p className="truncate text-xs text-gray-500">
                {recipient.username || recipient.email}
              </p>
              {recipient.contactEmail ? (
                <p className="truncate text-xs text-gray-500">
                  {recipient.contactEmail}
                </p>
              ) : null}
            </div>
            {showReason && recipient.skipReason ? (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {recipient.skipReason}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CredentialDeliveryPreviewStep({
  values,
  preview,
  isPreviewing,
  onPreview,
}: CredentialDeliveryPreviewStepProps) {
  const t = useTranslations("settings.email.credentialDeliveries");

  return (
    <SettingsSectionCard
      title={t("preview.title")}
      description={t("preview.description")}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.template")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {t(`templateKeys.${values.templateKey}`)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.mode")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {t(`credentialModes.${values.credentialMode}`)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.contact_email")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {values.requireContactEmail ? t("yes") : t("no")}
            </p>
          </div>
        </div>

        <Button variant="secondary" loading={isPreviewing} onClick={() => void onPreview()}>
          {isPreviewing ? t("actions.previewing") : t("actions.preview")}
        </Button>

        {preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-700">{t("preview.eligible")}</p>
                <p className="mt-1 text-2xl font-semibold text-green-900">
                  {preview.eligibleCount}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">{t("preview.skipped")}</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">
                  {preview.skippedCount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("preview.sample_eligible")}
                </h3>
                <RecipientList
                  recipients={preview.eligibleSample || []}
                  emptyLabel={t("preview.no_eligible")}
                />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("preview.sample_skipped")}
                </h3>
                <RecipientList
                  recipients={preview.skippedSample || []}
                  emptyLabel={t("preview.no_skipped")}
                  showReason
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="font-semibold text-gray-900">{t("preview.empty_title")}</p>
            <p className="mt-1 text-sm text-gray-500">
              {t("preview.empty_description")}
            </p>
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}

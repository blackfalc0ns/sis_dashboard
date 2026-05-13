"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import CredentialDeliveryAudienceStep from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryAudienceStep";
import CredentialDeliveryModeStep from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryModeStep";
import CredentialDeliveryPreviewStep from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep";
import CredentialDeliveryConfirmStep from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep";
import { useTranslations } from "next-intl";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";
import type {
  CreateCredentialDeliveryResponse,
  CredentialDeliveryAudience,
  CredentialDeliveryMode,
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";

export type CredentialDeliveryAudienceMode =
  | "selected-users"
  | "role"
  | "user-type"
  | "missing-password"
  | "must-change-password"
  | "all-school";

export interface CredentialDeliveryWizardValues {
  audienceMode: CredentialDeliveryAudienceMode;
  audience: CredentialDeliveryAudience;
  selectedUserIdsText: string;
  templateKey: EmailTemplateKey;
  credentialMode: CredentialDeliveryMode;
  requireContactEmail: boolean;
}

interface CredentialDeliveryWizardProps {
  canManage: boolean;
  roles: RoleDefinition[];
  preview: CredentialDeliveryPreviewResponse | null;
  createdBatch: CreateCredentialDeliveryResponse | null;
  isPreviewing: boolean;
  isCreating: boolean;
  onPreview: (
    values: CredentialDeliveryWizardValues,
  ) => Promise<CredentialDeliveryPreviewResponse | null>;
  onCreate: (
    values: CredentialDeliveryWizardValues,
  ) => Promise<CreateCredentialDeliveryResponse | null>;
}

const initialValues: CredentialDeliveryWizardValues = {
  audienceMode: "missing-password",
  audience: {
    missingPasswordOnly: true,
  },
  selectedUserIdsText: "",
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
  requireContactEmail: true,
};

export default function CredentialDeliveryWizard({
  canManage,
  roles,
  preview,
  createdBatch,
  isPreviewing,
  isCreating,
  onPreview,
  onCreate,
}: CredentialDeliveryWizardProps) {
  const t = useTranslations("settings.email.credentialDeliveries");
  const [values, setValues] =
    useState<CredentialDeliveryWizardValues>(initialValues);
  const [step, setStep] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      t("steps.audience"),
      t("steps.mode"),
      t("steps.preview"),
      t("steps.confirm"),
    ],
    [t],
  );

  const updateValues = (next: Partial<CredentialDeliveryWizardValues>) => {
    setValues((current) => ({ ...current, ...next }));
    setValidationError(null);
  };

  const validateAudience = () => {
    if (
      values.audienceMode === "selected-users" &&
      (values.audience.userIds || []).length === 0
    ) {
      return t("validation.selected_users_required");
    }
    if (values.audienceMode === "role" && !values.audience.roleId) {
      return t("validation.role_required");
    }
    if (values.audienceMode === "user-type" && !values.audience.userType) {
      return t("validation.user_type_required");
    }
    return null;
  };

  const goNext = () => {
    const error = step === 0 ? validateAudience() : null;
    if (error) {
      setValidationError(error);
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handlePreview = async () => {
    const error = validateAudience();
    if (error) {
      setValidationError(error);
      setStep(0);
      return;
    }
    const result = await onPreview(values);
    if (result) {
      setStep(2);
    }
  };

  const handleCreate = async () => {
    const result = await onCreate(values);
    if (result) {
      setStep(3);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard title={t("wizard.title")} description={t("wizard.description")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                index === step
                  ? "border-primary bg-primary/5 text-primary"
                  : index < step
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </SettingsSectionCard>

      {validationError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {validationError}
        </p>
      ) : null}

      {step === 0 ? (
        <CredentialDeliveryAudienceStep
          values={values}
          roles={roles}
          onChange={updateValues}
        />
      ) : null}
      {step === 1 ? (
        <CredentialDeliveryModeStep values={values} onChange={updateValues} />
      ) : null}
      {step === 2 ? (
        <CredentialDeliveryPreviewStep
          values={values}
          preview={preview}
          isPreviewing={isPreviewing}
          onPreview={handlePreview}
        />
      ) : null}
      {step === 3 ? (
        <CredentialDeliveryConfirmStep
          values={values}
          preview={preview}
          createdBatch={createdBatch}
          canManage={canManage}
          isCreating={isCreating}
          onCreate={handleCreate}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          {t("actions.back")}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={isPreviewing}
            onClick={() => void handlePreview()}
          >
            {isPreviewing ? t("actions.previewing") : t("actions.preview")}
          </Button>
          {step < 3 ? (
            <Button
              variant="primary"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={goNext}
            >
              {t("actions.next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              loading={isCreating}
              disabled={
                !canManage ||
                !preview ||
                preview.eligibleCount < 1 ||
                Boolean(createdBatch)
              }
              onClick={() => void handleCreate()}
            >
              {isCreating ? t("actions.creating") : t("actions.create")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

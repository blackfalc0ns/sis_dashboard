"use client";

import { CheckCircle2, Loader2, Mail, Search, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type {
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";

interface UsernamePreviewCardProps {
  username: string;
  onUsernameChange: (value: string) => void;
  preview: UsernamePreviewResponse | null;
  availability: UsernameAvailabilityResponse | null;
  error: string | null;
  isLoadingPreview: boolean;
  isCheckingAvailability: boolean;
  canUseActions: boolean;
  onPreview: () => void;
  onCheckAvailability: () => void;
}

export default function UsernamePreviewCard({
  username,
  onUsernameChange,
  preview,
  availability,
  error,
  isLoadingPreview,
  isCheckingAvailability,
  canUseActions,
  onPreview,
  onCheckAvailability,
}: UsernamePreviewCardProps) {
  const t = useTranslations("settings.loginIdentity.preview");
  const generatedLoginEmail = preview?.loginEmail;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {t("description")}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t("username_label")}
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder={t("username_placeholder")}
          disabled={!canUseActions}
          error={error || undefined}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={
              isLoadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )
            }
            disabled={!canUseActions || !username.trim()}
            onClick={onPreview}
          >
            {t("preview_button")}
          </Button>
          <Button
            variant="secondary"
            leftIcon={
              isCheckingAvailability ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )
            }
            disabled={!canUseActions || !username.trim()}
            onClick={onCheckAvailability}
          >
            {t("availability_button")}
          </Button>
        </div>

        {generatedLoginEmail ? (
          <div className="rounded-lg border border-emerald-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase text-gray-500">
              {t("generated_email_label")}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-gray-900">
              {generatedLoginEmail}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {t("login_identity_note")}
            </p>
          </div>
        ) : null}

        {availability ? (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              availability.available
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {availability.available ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>
              {availability.available
                ? t("available")
                : availability.reason || t("unavailable")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

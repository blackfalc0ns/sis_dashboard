"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import FileUploadButton from "@/components/ui/file-upload/FileUploadButton";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { timezones } from "@/features/settings/constants/defaults";
import {
  fetchSchoolProfileSettings,
  updateSchoolProfileSettings,
} from "@/features/settings/services/settingsService";
import type { SchoolProfileSettings } from "@/features/settings/types";

const emptyProfile: SchoolProfileSettings = {
  schoolName: "",
  shortName: "",
  timezone: "Africa/Cairo",
  addressLine: "",
  city: "",
  country: "",
  footerSignature: "",
  logoUrl: "",
};

export default function SettingsBrandingPage() {
  const t = useTranslations("settings.branding");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-branding");
  const [profile, setProfile] = useState<SchoolProfileSettings>(emptyProfile);
  const [initialProfile, setInitialProfile] = useState<SchoolProfileSettings>(emptyProfile);
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolProfileSettings, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextProfile = await fetchSchoolProfileSettings();
        if (!isCancelled) {
          setProfile(nextProfile);
          setInitialProfile(nextProfile);
          clearDirty();
        }
      } catch {
        if (!isCancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (JSON.stringify(profile) === JSON.stringify(initialProfile)) {
      clearDirty();
      return;
    }
    markDirty();
  }, [clearDirty, initialProfile, markDirty, profile]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof SchoolProfileSettings, string>> = {};

    if (!profile.schoolName.trim()) {
      nextErrors.schoolName = t("validation.school_name_required");
    }
    if (!profile.shortName.trim()) {
      nextErrors.shortName = t("validation.short_name_required");
    }
    if (!profile.timezone.trim()) {
      nextErrors.timezone = t("validation.timezone_required");
    }
    if (!profile.addressLine.trim()) {
      nextErrors.addressLine = t("validation.address_required");
    }
    if (!profile.city.trim()) {
      nextErrors.city = t("validation.city_required");
    }
    if (!profile.country.trim()) {
      nextErrors.country = t("validation.country_required");
    }
    if (!profile.footerSignature.trim()) {
      nextErrors.footerSignature = t("validation.footer_required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange =
    (key: keyof SchoolProfileSettings) =>
    (eventOrValue: ChangeEvent<HTMLInputElement> | string) => {
      const value =
        typeof eventOrValue === "string" ? eventOrValue : eventOrValue.target.value;
      setProfile((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const savedProfile = await updateSchoolProfileSettings(profile);
      setProfile(savedProfile);
      setInitialProfile(savedProfile);
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(emptyProfile);
    setErrors({});
    markDirty();
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setErrors({});
    clearDirty();
  };

  const canSave = useMemo(() => isDirty && !isSaving, [isDirty, isSaving]);

  const handleLogoUpload = async (files: File[]) => {
    const [file] = files;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfile((current) => ({ ...current, logoUrl: result }));
      markDirty();
    };
    reader.onerror = () => showError(t("messages.logo_upload_failed"));
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.branding.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!isDirty || isSaving || !hasPermission("settings.branding.manage")} onClick={handleCancel}>
              {t("cancel_changes")}
            </Button>
            <Button variant="secondary" disabled={isSaving || !hasPermission("settings.branding.manage")} onClick={handleReset}>
              {tCommon("reset")}
            </Button>
            <Button variant="primary" loading={isSaving} disabled={!canSave || !hasPermission("settings.branding.manage")} onClick={handleSave}>
              {isSaving ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SettingsSectionCard
          title={t("logo_title")}
          description={t("logo_description")}
        >
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoUrl}
                alt={profile.schoolName}
                className="mb-4 h-24 w-24 rounded-full object-cover ring-4 ring-white"
              />
            ) : (
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-primary">
                <ImagePlus className="h-10 w-10" />
              </div>
            )}
            <p className="text-sm font-semibold text-gray-900">{t("upload_placeholder")}</p>
            <p className="mt-2 max-w-sm text-sm text-gray-500">{t("upload_hint")}</p>
            <div className="mt-4">
              <FileUploadButton
                accept="image/*"
                maxSizeBytes={2 * 1024 * 1024}
                buttonLabel={t("upload_button")}
                disabled={!hasPermission("settings.branding.manage")}
                onFilesSelected={(files) => void handleLogoUpload(files)}
                onError={() => showError(t("messages.logo_upload_failed"))}
              />
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title={t("profile_title")}
          description={t("profile_description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("school_name")}
              value={profile.schoolName}
              onChange={handleChange("schoolName")}
              error={errors.schoolName}
            />
            <Input
              label={t("short_name")}
              value={profile.shortName}
              onChange={handleChange("shortName")}
              error={errors.shortName}
            />
            <Select
              label={t("timezone")}
              value={profile.timezone}
              onChange={handleChange("timezone")}
              error={errors.timezone}
              options={timezones.map((timezone) => ({
                value: timezone,
                label: timezone,
              }))}
            />
            <Input
              label={t("city")}
              value={profile.city}
              onChange={handleChange("city")}
            />
            <div className="md:col-span-2">
              <Input
                label={t("address")}
                value={profile.addressLine}
                onChange={handleChange("addressLine")}
                error={errors.addressLine}
              />
            </div>
            <Input
              label={t("country")}
              value={profile.country}
              onChange={handleChange("country")}
            />
            <Input
              label={t("footer_signature")}
              value={profile.footerSignature}
              onChange={handleChange("footerSignature")}
              error={errors.footerSignature}
            />
          </div>
        </SettingsSectionCard>
      </div>
      </main>
    </SettingsAccessGuard>
  );
}

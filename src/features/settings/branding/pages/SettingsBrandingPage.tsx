"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, ImagePlus, MapPin } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SchoolLocationPickerModal from "@/features/settings/components/SchoolLocationPickerModal";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import { timezones } from "@/features/settings/constants/defaults";
import {
  fetchSchoolProfileSettings,
  updateSchoolProfileSettings,
} from "@/features/settings/services/settingsService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type {
  ResolvedSchoolLocation,
  SchoolProfileSettings,
} from "@/features/settings/types";

const emptyProfile: SchoolProfileSettings = {
  schoolName: "",
  shortName: "",
  timezone: "Africa/Cairo",
  addressLine: "",
  formattedAddress: "",
  city: "",
  country: "",
  footerSignature: "",
  logoUrl: "",
  latitude: null,
  longitude: null,
  mapPlaceLabel: "",
};

function profileToLocation(profile: SchoolProfileSettings): ResolvedSchoolLocation | null {
  if (profile.latitude === null || profile.longitude === null || !profile.formattedAddress.trim()) {
    return null;
  }

  return {
    label: profile.mapPlaceLabel?.trim() || profile.schoolName || profile.shortName || profile.city,
    formattedAddress: profile.formattedAddress,
    addressLine: profile.addressLine,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
  };
}

export default function SettingsBrandingPage() {
  const locale = useLocale();
  const t = useTranslations("settings.branding");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-branding");
  const [profile, setProfile] = useState<SchoolProfileSettings>(emptyProfile);
  const [initialProfile, setInitialProfile] = useState<SchoolProfileSettings>(emptyProfile);
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolProfileSettings, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [locationWasEdited, setLocationWasEdited] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextProfile = await fetchSchoolProfileSettings();
        if (!isCancelled) {
          setProfile(nextProfile);
          setInitialProfile(nextProfile);
          setLocationWasEdited(false);
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
    if (profile.latitude === null || profile.longitude === null) {
      nextErrors.addressLine = t("validation.location_required");
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

      setProfile((current) => {
        if (key === "addressLine") {
          return {
            ...current,
            addressLine: value,
            formattedAddress: value,
            latitude: null,
            longitude: null,
            mapPlaceLabel: "",
          };
        }

        return { ...current, [key]: value };
      });

      if (key === "addressLine") {
        setLocationWasEdited(true);
      }
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
      setLocationWasEdited(false);
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
    setLocationWasEdited(false);
    markDirty();
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setErrors({});
    setLocationWasEdited(false);
    clearDirty();
  };

  const canSave = useMemo(() => isDirty && !isSaving, [isDirty, isSaving]);

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: 1,
    };
    const columns: ExportColumn[] = [
      { key: "field", label: locale === "ar" ? "الحقل" : "Field" },
      { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
    ];
    const rows = [
      { field: t("school_name"), value: profile.schoolName },
      { field: t("short_name"), value: profile.shortName },
      { field: t("timezone"), value: profile.timezone },
      { field: t("address"), value: profile.addressLine },
      { field: t("city"), value: profile.city },
      { field: t("country"), value: profile.country },
      { field: t("footer_signature"), value: profile.footerSignature },
      { field: t("selected_location_title"), value: profile.formattedAddress },
      {
        field: "Coordinates",
        value:
          profile.latitude !== null && profile.longitude !== null
            ? `${profile.latitude}, ${profile.longitude}`
            : "",
      },
    ];

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-branding",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Branding",
        metadata,
        schoolProfile: profile,
      },
    });
  };

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

  const handleLocationConfirm = (location: ResolvedSchoolLocation) => {
    setProfile((current) => ({
      ...current,
      addressLine: location.addressLine,
      formattedAddress: location.formattedAddress,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      mapPlaceLabel: location.label,
    }));
    setLocationWasEdited(false);
    setErrors((current) => ({
      ...current,
      addressLine: undefined,
      city: undefined,
      country: undefined,
    }));
    setIsLocationModalOpen(false);
  };

  const handleClearLocation = () => {
    setProfile((current) => ({
      ...current,
      addressLine: "",
      formattedAddress: "",
      latitude: null,
      longitude: null,
      mapPlaceLabel: "",
    }));
    setLocationWasEdited(false);
    markDirty();
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
              <Button
                variant="secondary"
                disabled={!isDirty || isSaving || !hasPermission("settings.branding.manage")}
                onClick={handleCancel}
              >
                {t("cancel_changes")}
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => setIsExportModalOpen(true)}
              >
                {tExport("button")}
              </Button>
              <Button
                variant="secondary"
                disabled={isSaving || !hasPermission("settings.branding.manage")}
                onClick={handleReset}
              >
                {tCommon("reset")}
              </Button>
              <Button
                variant="primary"
                loading={isSaving}
                disabled={!canSave || !hasPermission("settings.branding.manage")}
                onClick={handleSave}
              >
                {isSaving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SettingsSectionCard title={t("logo_title")} description={t("logo_description")}>
            <div className="space-y-4">
              {profile.logoUrl ? (
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.logoUrl}
                    alt={profile.schoolName}
                    className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{profile.schoolName}</p>
                    <p className="mt-1 text-sm text-gray-500">{t("upload_preview_hint")}</p>
                  </div>
                </div>
              ) : null}

              <DragDropUploadArea
                title={t("upload_placeholder")}
                subtitle={t("upload_hint")}
                buttonLabel={t("upload_button")}
                accept="image/*"
                maxSizeBytes={2 * 1024 * 1024}
                multiple={false}
                disabled={!hasPermission("settings.branding.manage")}
                helperText={t("upload_drop_hint")}
                onFilesSelected={(files) => void handleLogoUpload(files)}
              />

              {!profile.logoUrl ? (
                <div className="flex items-center justify-center text-sm text-gray-400">
                  <ImagePlus className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard title={t("profile_title")} description={t("profile_description")}>
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
                error={errors.city}
              />
              <div className="space-y-3 md:col-span-2">
                <Input
                  label={t("address")}
                  value={profile.addressLine}
                  onChange={handleChange("addressLine")}
                  error={errors.addressLine}
                  helperText={locationWasEdited ? t("location_stale") : t("location_helper")}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!hasPermission("settings.branding.manage")}
                    onClick={() => setIsLocationModalOpen(true)}
                  >
                    <MapPin className="h-4 w-4" />
                    {t("pick_from_map")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!profile.formattedAddress || !hasPermission("settings.branding.manage")}
                    onClick={handleClearLocation}
                  >
                    {t("clear_location")}
                  </Button>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <div className="font-semibold text-gray-900">{t("selected_location_title")}</div>
                  {profile.formattedAddress ? (
                    <>
                      <div className="mt-1">{profile.mapPlaceLabel || profile.schoolName}</div>
                      <div className="mt-1 text-gray-500">{profile.formattedAddress}</div>
                      {profile.latitude !== null && profile.longitude !== null ? (
                        <div className="mt-2 text-xs text-gray-500">
                          {t("coordinates", {
                            lat: profile.latitude.toFixed(5),
                            lng: profile.longitude.toFixed(5),
                          })}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-1 text-gray-500">{t("no_location_selected")}</div>
                  )}
                </div>
              </div>
              <Input
                label={t("country")}
                value={profile.country}
                onChange={handleChange("country")}
                error={errors.country}
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

        <SchoolLocationPickerModal
          isOpen={isLocationModalOpen}
          initialQuery={profile.formattedAddress || profile.addressLine || profile.city}
          initialLocation={profileToLocation(profile)}
          onClose={() => setIsLocationModalOpen(false)}
          onConfirm={handleLocationConfirm}
        />
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={1}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}

import { apiGet, apiPatch } from "@/lib/api";
import type {
  BrandingApiDto,
  SchoolProfileSettings,
} from "@/features/settings/types";

export const BRANDING_UPDATED_EVENT = "branding-updated";

const EMPTY_BRANDING_PROFILE: SchoolProfileSettings = {
  schoolName: "",
  shortName: "",
  timezone: "",
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

let brandingCache: SchoolProfileSettings | null = null;

function normalizeNullableText(value: string | null | undefined): string {
  return value ?? "";
}

export function brandingApiToForm(
  payload: BrandingApiDto,
): SchoolProfileSettings {
  return {
    schoolName: normalizeNullableText(payload.schoolName),
    shortName: normalizeNullableText(payload.shortName),
    timezone: normalizeNullableText(payload.timezone),
    addressLine: normalizeNullableText(payload.addressLine),
    formattedAddress: normalizeNullableText(payload.formattedAddress),
    city: normalizeNullableText(payload.city),
    country: normalizeNullableText(payload.country),
    footerSignature: normalizeNullableText(payload.footerSignature),
    logoUrl: normalizeNullableText(payload.logoUrl),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    mapPlaceLabel: normalizeNullableText(payload.mapPlaceLabel),
  };
}

export function brandingFormToApi(
  payload: SchoolProfileSettings,
): BrandingApiDto {
  const toNullable = (value: string) => {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  };

  return {
    schoolName: toNullable(payload.schoolName),
    shortName: toNullable(payload.shortName),
    timezone: toNullable(payload.timezone),
    addressLine: toNullable(payload.addressLine),
    formattedAddress: toNullable(payload.formattedAddress),
    city: toNullable(payload.city),
    country: toNullable(payload.country),
    footerSignature: toNullable(payload.footerSignature),
    logoUrl: toNullable(payload.logoUrl),
    latitude: payload.latitude,
    longitude: payload.longitude,
    mapPlaceLabel: toNullable(payload.mapPlaceLabel),
  };
}

function cloneProfile(profile: SchoolProfileSettings): SchoolProfileSettings {
  return JSON.parse(JSON.stringify(profile)) as SchoolProfileSettings;
}

function cacheAndReturn(profile: SchoolProfileSettings) {
  brandingCache = cloneProfile(profile);
  return cloneProfile(profile);
}

function emitBrandingUpdated(profile: SchoolProfileSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SchoolProfileSettings>(BRANDING_UPDATED_EVENT, {
      detail: cloneProfile(profile),
    }),
  );
}

export function getCachedBrandingProfile() {
  return brandingCache ? cloneProfile(brandingCache) : null;
}

export function getEmptyBrandingProfile() {
  return cloneProfile(EMPTY_BRANDING_PROFILE);
}

export async function fetchBrandingProfile(
  options?: { force?: boolean },
): Promise<SchoolProfileSettings> {
  if (!options?.force && brandingCache) {
    return cloneProfile(brandingCache);
  }

  const response = await apiGet<BrandingApiDto>("/settings/branding");
  return cacheAndReturn(brandingApiToForm(response));
}

export async function updateBrandingProfile(
  payload: SchoolProfileSettings,
): Promise<SchoolProfileSettings> {
  const response = await apiPatch<BrandingApiDto>(
    "/settings/branding",
    brandingFormToApi(payload),
  );
  const normalized = brandingApiToForm(response);
  const cached = cacheAndReturn(normalized);
  emitBrandingUpdated(cached);
  return cached;
}

export function calculateBrandingProfileCompleteness(
  profile: SchoolProfileSettings,
) {
  const requiredValues = [
    profile.schoolName,
    profile.shortName,
    profile.timezone,
    profile.addressLine,
    profile.city,
    profile.country,
    profile.footerSignature,
    profile.logoUrl,
  ];

  const completedCount = requiredValues.filter(
    (value) => value.trim().length > 0,
  ).length;

  return Math.round((completedCount / requiredValues.length) * 100);
}

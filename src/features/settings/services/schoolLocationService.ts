import type {
  LocationSuggestion,
  ResolvedSchoolLocation,
} from "@/features/settings/types";

export interface SchoolLocationProviderAdapter {
  searchLocations(query: string): Promise<LocationSuggestion[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<ResolvedSchoolLocation>;
}

const EGYPT_BOUNDS = {
  minLat: 22,
  maxLat: 31.7,
  minLng: 24.7,
  maxLng: 36.9,
};

const locationCatalog: LocationSuggestion[] = [
  {
    id: "loc-new-cairo-90",
    label: "North 90 Street, New Cairo",
    formattedAddress:
      "North 90 Street, Fifth Settlement, New Cairo, Cairo Governorate, Egypt",
    city: "Cairo",
    country: "Egypt",
    latitude: 30.0284,
    longitude: 31.4913,
  },
  {
    id: "loc-zayed",
    label: "Sheikh Zayed City",
    formattedAddress: "Sheikh Zayed City, Giza Governorate, Egypt",
    city: "Giza",
    country: "Egypt",
    latitude: 30.0519,
    longitude: 30.9764,
  },
  {
    id: "loc-maadi",
    label: "Maadi",
    formattedAddress: "Maadi, Cairo Governorate, Egypt",
    city: "Cairo",
    country: "Egypt",
    latitude: 29.9602,
    longitude: 31.2569,
  },
  {
    id: "loc-smouha",
    label: "Smouha",
    formattedAddress: "Smouha, Alexandria Governorate, Egypt",
    city: "Alexandria",
    country: "Egypt",
    latitude: 31.2156,
    longitude: 29.9553,
  },
  {
    id: "loc-mansoura",
    label: "Mansoura",
    formattedAddress: "Mansoura, Dakahlia Governorate, Egypt",
    city: "Mansoura",
    country: "Egypt",
    latitude: 31.0409,
    longitude: 31.3785,
  },
  {
    id: "loc-october",
    label: "6th of October City",
    formattedAddress: "6th of October City, Giza Governorate, Egypt",
    city: "Giza",
    country: "Egypt",
    latitude: 29.9285,
    longitude: 30.9188,
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function scoreSuggestion(query: string, suggestion: LocationSuggestion) {
  const normalizedQuery = normalizeText(query);
  const haystack = [suggestion.label, suggestion.formattedAddress, suggestion.city, suggestion.country]
    .join(" ")
    .toLowerCase();
  if (!normalizedQuery) return 0;
  if (haystack.startsWith(normalizedQuery)) return 3;
  if (haystack.includes(normalizedQuery)) return 2;
  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toAddressLine(formattedAddress: string) {
  return formattedAddress.split(",").slice(0, 2).join(",").trim();
}

function nearestCatalogEntry(latitude: number, longitude: number) {
  return locationCatalog.reduce((closest, current) => {
    const closestDistance =
      Math.abs(closest.latitude - latitude) + Math.abs(closest.longitude - longitude);
    const currentDistance =
      Math.abs(current.latitude - latitude) + Math.abs(current.longitude - longitude);
    return currentDistance < closestDistance ? current : closest;
  });
}

const mockAdapter: SchoolLocationProviderAdapter = {
  async searchLocations(query: string) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return locationCatalog.slice(0, 5);
    }

    return locationCatalog
      .map((suggestion) => ({ suggestion, score: scoreSuggestion(normalizedQuery, suggestion) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.suggestion)
      .slice(0, 6);
  },

  async reverseGeocode(latitude: number, longitude: number) {
    const boundedLatitude = clamp(latitude, EGYPT_BOUNDS.minLat, EGYPT_BOUNDS.maxLat);
    const boundedLongitude = clamp(longitude, EGYPT_BOUNDS.minLng, EGYPT_BOUNDS.maxLng);
    const nearest = nearestCatalogEntry(boundedLatitude, boundedLongitude);

    return {
      label: nearest.label,
      formattedAddress: nearest.formattedAddress,
      addressLine: toAddressLine(nearest.formattedAddress),
      city: nearest.city,
      country: nearest.country,
      latitude: Number(boundedLatitude.toFixed(6)),
      longitude: Number(boundedLongitude.toFixed(6)),
    };
  },
};

let activeSchoolLocationAdapter: SchoolLocationProviderAdapter = mockAdapter;

export function setSchoolLocationProviderAdapter(adapter: SchoolLocationProviderAdapter) {
  activeSchoolLocationAdapter = adapter;
}

export function resetSchoolLocationProviderAdapter() {
  activeSchoolLocationAdapter = mockAdapter;
}

export async function searchSchoolLocations(query: string) {
  return activeSchoolLocationAdapter.searchLocations(query);
}

export async function reverseGeocodeSchoolLocation(latitude: number, longitude: number) {
  return activeSchoolLocationAdapter.reverseGeocode(latitude, longitude);
}

export function buildSchoolLocationPreviewUrl(latitude: number, longitude: number) {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
}

export function projectCoordinatesToCanvas(latitude: number, longitude: number) {
  const x = ((longitude - EGYPT_BOUNDS.minLng) / (EGYPT_BOUNDS.maxLng - EGYPT_BOUNDS.minLng)) * 100;
  const y = (1 - (latitude - EGYPT_BOUNDS.minLat) / (EGYPT_BOUNDS.maxLat - EGYPT_BOUNDS.minLat)) * 100;
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

export function projectCanvasPointToCoordinates(xPercent: number, yPercent: number) {
  const longitude =
    EGYPT_BOUNDS.minLng + (clamp(xPercent, 0, 100) / 100) * (EGYPT_BOUNDS.maxLng - EGYPT_BOUNDS.minLng);
  const latitude =
    EGYPT_BOUNDS.minLat +
    ((100 - clamp(yPercent, 0, 100)) / 100) * (EGYPT_BOUNDS.maxLat - EGYPT_BOUNDS.minLat);

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
}

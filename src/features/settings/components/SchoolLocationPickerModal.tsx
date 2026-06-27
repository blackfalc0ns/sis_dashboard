"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import type {
  LocationSuggestion,
  ResolvedSchoolLocation,
} from "@/features/settings/types";

type GoogleLatLngLiteral = { lat: number; lng: number };

type GooglePlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GooglePlaceResult = {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
};

type GoogleGeocoderResult = GooglePlaceResult;
type GoogleMapsStatus = "OK" | "ZERO_RESULTS" | string;

type GoogleMapInstance = {
  setCenter: (position: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  addListener: (
    eventName: "click",
    callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void,
  ) => void;
};

type GoogleMarkerInstance = {
  setPosition: (position: GoogleLatLngLiteral) => void;
  addListener: (
    eventName: "dragend",
    callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void,
  ) => void;
};

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: { input: string; language?: string },
    callback: (
      predictions: GooglePlacePrediction[] | null,
      status: GoogleMapsStatus,
    ) => void,
  ) => void;
};

type GooglePlacesService = {
  getDetails: (
    request: { placeId: string; fields: string[]; language?: string },
    callback: (place: GooglePlaceResult | null, status: GoogleMapsStatus) => void,
  ) => void;
};

type GoogleGeocoder = {
  geocode: (
    request: { location: GoogleLatLngLiteral; language?: string },
    callback: (
      results: GoogleGeocoderResult[] | null,
      status: GoogleMapsStatus,
    ) => void,
  ) => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLngLiteral;
        zoom: number;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
        streetViewControl?: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (options: {
      map: GoogleMapInstance;
      position: GoogleLatLngLiteral;
      draggable: boolean;
    }) => GoogleMarkerInstance;
    places: {
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesService: new (element: HTMLDivElement) => GooglePlacesService;
    };
    Geocoder: new () => GoogleGeocoder;
  };
};

declare global {
  interface Window {
    __moazezGoogleMapsPromise?: Promise<GoogleMapsApi>;
  }
}

interface SchoolLocationPickerModalProps {
  isOpen: boolean;
  initialQuery: string;
  initialLocation: ResolvedSchoolLocation | null;
  onClose: () => void;
  onConfirm: (location: ResolvedSchoolLocation) => void;
}

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js-api";

function getGoogleMapsApi() {
  return window.google as unknown as GoogleMapsApi | undefined;
}

function loadGoogleMapsApi(apiKey: string, language: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("maps_unavailable"));
  }

  const loadedGoogleApi = getGoogleMapsApi();
  if (loadedGoogleApi?.maps?.places) {
    return Promise.resolve(loadedGoogleApi);
  }

  if (window.__moazezGoogleMapsPromise) {
    return window.__moazezGoogleMapsPromise;
  }

  window.__moazezGoogleMapsPromise = new Promise<GoogleMapsApi>(
    (resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          const googleApi = getGoogleMapsApi();
          if (googleApi) {
            resolve(googleApi);
            return;
          }
          reject(new Error("maps_load_failed"));
        });
        existingScript.addEventListener("error", () =>
          reject(new Error("maps_load_failed")),
        );
        return;
      }

      const script = document.createElement("script");
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${encodeURIComponent(language)}`;
      script.onload = () => {
        const googleApi = getGoogleMapsApi();
        if (googleApi) {
          resolve(googleApi);
          return;
        }
        reject(new Error("maps_load_failed"));
      };
      script.onerror = () => reject(new Error("maps_load_failed"));
      document.head.appendChild(script);
    },
  );

  return window.__moazezGoogleMapsPromise;
}

function getComponent(
  components: GooglePlaceResult["address_components"],
  types: string[],
) {
  return (
    components?.find((component) =>
      types.some((type) => component.types.includes(type)),
    )?.long_name ?? ""
  );
}

function placeToResolvedLocation(
  place: GooglePlaceResult,
): ResolvedSchoolLocation | null {
  const location = place.geometry?.location;
  if (!location) {
    return null;
  }

  const formattedAddress = place.formatted_address ?? "";
  const city = getComponent(place.address_components, [
    "locality",
    "administrative_area_level_2",
    "administrative_area_level_1",
  ]);
  const country = getComponent(place.address_components, ["country"]);

  return {
    label: place.name || formattedAddress,
    formattedAddress,
    addressLine: formattedAddress.split(",").slice(0, 2).join(",").trim(),
    city,
    country,
    latitude: Number(location.lat().toFixed(6)),
    longitude: Number(location.lng().toFixed(6)),
  };
}

function predictionToSuggestion(prediction: GooglePlacePrediction): LocationSuggestion {
  return {
    id: prediction.place_id,
    label: prediction.structured_formatting?.main_text || prediction.description,
    formattedAddress:
      prediction.structured_formatting?.secondary_text || prediction.description,
    city: "",
    country: "",
    latitude: 0,
    longitude: 0,
  };
}

export default function SchoolLocationPickerModal({
  isOpen,
  initialQuery,
  initialLocation,
  onClose,
  onConfirm,
}: SchoolLocationPickerModalProps) {
  const t = useTranslations("settings.branding.location_picker");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const placesHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const autocompleteRef = useRef<GoogleAutocompleteService | null>(null);
  const placesRef = useRef<GooglePlacesService | null>(null);
  const geocoderRef = useRef<GoogleGeocoder | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<ResolvedSchoolLocation | null>(initialLocation);
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPosition = useMemo<GoogleLatLngLiteral>(
    () =>
      selectedLocation
        ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
        : DEFAULT_CENTER,
    [selectedLocation],
  );

  const updateMarker = useCallback((position: GoogleLatLngLiteral) => {
    markerRef.current?.setPosition(position);
    mapRef.current?.setCenter(position);
  }, []);

  const resolveCoordinates = useCallback(
    async (position: GoogleLatLngLiteral) => {
      if (!geocoderRef.current) {
        return;
      }

      setIsResolving(true);
      setError(null);
      geocoderRef.current.geocode(
        { location: position, language: locale },
        (geocoderResults, status) => {
          setIsResolving(false);
          if (status !== "OK" || !geocoderResults?.[0]) {
            setError(t("errors.resolve_failed"));
            return;
          }

          const resolved = placeToResolvedLocation({
            ...geocoderResults[0],
            name: geocoderResults[0].formatted_address,
          });
          if (!resolved) {
            setError(t("errors.resolve_failed"));
            return;
          }

          setSelectedLocation(resolved);
          updateMarker({ lat: resolved.latitude, lng: resolved.longitude });
        },
      );
    },
    [locale, t, updateMarker],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    queueMicrotask(() => {
      setQuery(initialQuery);
      setSelectedLocation(initialLocation);
      setResults([]);
      setError(null);
    });
  }, [initialLocation, initialQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!apiKey) {
      queueMicrotask(() => setError(t("errors.api_key_missing")));
      return;
    }

    if (!mapContainerRef.current || !placesHostRef.current) {
      return;
    }

    queueMicrotask(() => {
      setIsMapsLoading(true);
      setError(null);
    });

    void loadGoogleMapsApi(apiKey, locale)
      .then((googleApi) => {
        if (!mapContainerRef.current || !placesHostRef.current) {
          return;
        }

        const map = new googleApi.maps.Map(mapContainerRef.current, {
          center: selectedPosition,
          zoom: selectedLocation ? 16 : 12,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
        });
        const marker = new googleApi.maps.Marker({
          map,
          position: selectedPosition,
          draggable: true,
        });

        map.addListener("click", (event) => {
          if (!event.latLng) return;
          const nextPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          marker.setPosition(nextPosition);
          void resolveCoordinates(nextPosition);
        });
        marker.addListener("dragend", (event) => {
          if (!event.latLng) return;
          void resolveCoordinates({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
        autocompleteRef.current = new googleApi.maps.places.AutocompleteService();
        placesRef.current = new googleApi.maps.places.PlacesService(
          placesHostRef.current,
        );
        geocoderRef.current = new googleApi.maps.Geocoder();
      })
      .catch(() => setError(t("errors.maps_load_failed")))
      .finally(() => setIsMapsLoading(false));
  }, [
    apiKey,
    isOpen,
    locale,
    resolveCoordinates,
    selectedLocation,
    selectedPosition,
    t,
  ]);

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      updateMarker(selectedPosition);
      mapRef.current.setZoom(selectedLocation ? 16 : 12);
    }
  }, [selectedLocation, selectedPosition, updateMarker]);

  const runSearch = useDebouncedCallback((nextQuery: string) => {
    if (!nextQuery.trim() || !autocompleteRef.current) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    autocompleteRef.current.getPlacePredictions(
      { input: nextQuery, language: locale },
      (predictions, status) => {
        setIsSearching(false);
        if (status === "ZERO_RESULTS") {
          setResults([]);
          return;
        }
        if (status !== "OK" || !predictions) {
          setError(t("errors.search_failed"));
          setResults([]);
          return;
        }
        setResults(predictions.map(predictionToSuggestion));
      },
    );
  }, 300);

  useEffect(() => {
    if (!isOpen || isMapsLoading) {
      return;
    }
    runSearch(query);
  }, [isMapsLoading, isOpen, query, runSearch]);

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (!placesRef.current) {
      return;
    }

    setIsResolving(true);
    setError(null);
    placesRef.current.getDetails(
      {
        placeId: suggestion.id,
        language: locale,
        fields: ["name", "formatted_address", "geometry", "address_components"],
      },
      (place, status) => {
        setIsResolving(false);
        if (status !== "OK" || !place) {
          setError(t("errors.resolve_failed"));
          return;
        }

        const resolved = placeToResolvedLocation(place);
        if (!resolved) {
          setError(t("errors.resolve_failed"));
          return;
        }

        setSelectedLocation(resolved);
        setQuery(resolved.formattedAddress);
        updateMarker({ lat: resolved.latitude, lng: resolved.longitude });
      },
    );
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {tCommon("cancel")}
      </Button>
      <Button
        variant="primary"
        disabled={!selectedLocation || isResolving || isMapsLoading}
        onClick={() => selectedLocation && onConfirm(selectedLocation)}
      >
        {t("confirm")}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("description")}
      size="xl"
      footer={footer}
    >
      <div
        className={`grid gap-6 lg:grid-cols-[0.95fr_1.05fr] ${isRTL ? "lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1" : ""}`}
      >
        <div className="space-y-4">
          <Input
            label={t("search_label")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search_placeholder")}
            leftIcon={<Search className="h-4 w-4" />}
            disabled={isMapsLoading || !apiKey}
            dir="ltr"
            className="text-left"
          />

          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              {t("results")}
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {isMapsLoading || isSearching ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isMapsLoading ? t("loading_maps") : t("searching")}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-500">
                  {t("no_results")}
                </div>
              ) : (
                results.map((result) => {
                  const isSelected =
                    selectedLocation?.formattedAddress ===
                    result.formattedAddress;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSuggestionSelect(result)}
                      className={`w-full rounded-xl px-3 py-3 text-start transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <div className="text-sm font-semibold" dir="auto">
                            {result.label}
                          </div>
                          <div
                            className="mt-1 text-xs text-gray-500"
                            dir="auto"
                          >
                            {result.formattedAddress}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              {t("map_title")}
            </div>
            <div className="p-4">
              <div className="relative h-80 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {isMapsLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading_maps")}
                  </div>
                ) : null}
                <div ref={mapContainerRef} className="h-full w-full" />
              </div>
              <div ref={placesHostRef} className="hidden" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-800">
              {t("selected_location")}
            </div>
            {isResolving ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("resolving")}
              </div>
            ) : selectedLocation ? (
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="font-semibold text-gray-900" dir="auto">
                  {selectedLocation.label}
                </div>
                <div dir="auto">{selectedLocation.formattedAddress}</div>
                <div className="text-xs text-gray-500">
                  <span dir="ltr">
                    {t("coordinates", {
                      lat: selectedLocation.latitude.toFixed(5),
                      lng: selectedLocation.longitude.toFixed(5),
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-500">
                {t("empty_state")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

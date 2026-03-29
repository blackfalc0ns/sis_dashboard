"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  buildSchoolLocationPreviewUrl,
  projectCanvasPointToCoordinates,
  projectCoordinatesToCanvas,
  reverseGeocodeSchoolLocation,
  searchSchoolLocations,
} from "@/features/settings/services/schoolLocationService";

interface SchoolLocationPickerModalProps {
  isOpen: boolean;
  initialQuery: string;
  initialLocation: ResolvedSchoolLocation | null;
  onClose: () => void;
  onConfirm: (location: ResolvedSchoolLocation) => void;
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
  const canvasRef = useRef<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<ResolvedSchoolLocation | null>(initialLocation);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery(initialQuery);
    setSelectedLocation(initialLocation);
    setError(null);
  }, [initialLocation, initialQuery, isOpen]);

  const runSearch = useDebouncedCallback(async (nextQuery: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const suggestions = await searchSchoolLocations(nextQuery);
      setResults(suggestions);
    } catch {
      setError(t("errors.search_failed"));
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 250);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void runSearch(query);
  }, [isOpen, query, runSearch]);

  const pinPosition = useMemo(() => {
    if (!selectedLocation) {
      return { x: 50, y: 45 };
    }
    return projectCoordinatesToCanvas(
      selectedLocation.latitude,
      selectedLocation.longitude,
    );
  }, [selectedLocation]);

  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    setIsResolving(true);
    setError(null);
    try {
      const resolved = await reverseGeocodeSchoolLocation(
        suggestion.latitude,
        suggestion.longitude,
      );
      setSelectedLocation({
        ...resolved,
        label: suggestion.label,
        formattedAddress: suggestion.formattedAddress,
        addressLine: suggestion.formattedAddress
          .split(",")
          .slice(0, 2)
          .join(",")
          .trim(),
      });
    } catch {
      setError(t("errors.resolve_failed"));
    } finally {
      setIsResolving(false);
    }
  };

  const handleCanvasPick = async (clientX: number, clientY: number) => {
    if (!canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const yPercent = ((clientY - rect.top) / rect.height) * 100;
    const coordinates = projectCanvasPointToCoordinates(xPercent, yPercent);

    setIsResolving(true);
    setError(null);
    try {
      const resolved = await reverseGeocodeSchoolLocation(
        coordinates.latitude,
        coordinates.longitude,
      );
      setSelectedLocation(resolved);
    } catch {
      setError(t("errors.resolve_failed"));
    } finally {
      setIsResolving(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {tCommon("cancel")}
      </Button>
      <Button
        variant="primary"
        disabled={!selectedLocation || isResolving}
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
            dir="ltr"
            className="text-left"
          />

          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              {t("results")}
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("searching")}
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
                      onClick={() => void handleSuggestionSelect(result)}
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
              <button
                ref={canvasRef}
                type="button"
                onClick={(event) =>
                  void handleCanvasPick(event.clientX, event.clientY)
                }
                className="relative h-64 w-full overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-[linear-gradient(180deg,#dff5f3_0%,#eef8ff_100%)] text-start"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(19,179,176,0.18),transparent_20%),radial-gradient(circle_at_70%_40%,rgba(3,108,128,0.12),transparent_24%),linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] bg-[size:auto,auto,32px_32px,32px_32px]" />
                <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm whitespace-normal">
                  {t("move_hint")}
                </div>
                <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 shadow-sm whitespace-normal">
                  {t("preview_note")}
                </div>
                <div
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${pinPosition.x}%`,
                    top: `${pinPosition.y}%`,
                  }}
                >
                  <div className="rounded-full bg-primary p-2 text-white shadow-lg shadow-primary/30">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
              </button>

              {selectedLocation ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
                  <iframe
                    title={t("iframe_title")}
                    src={buildSchoolLocationPreviewUrl(
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    )}
                    className="h-48 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
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

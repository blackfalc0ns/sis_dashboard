import type { GoogleLocationPickerLabels } from "@/components/ui/google-location-picker";

export function getNedaaLocationPickerLabels(
  translate: (key: string) => string,
): GoogleLocationPickerLabels {
  const key = (name: string) => translate(`settings.location_picker.${name}`);

  return {
    searchLabel: key("search_label"),
    searchPlaceholder: key("search_placeholder"),
    results: key("results"),
    mapTitle: key("map_title"),
    selectedLocation: key("selected_location"),
    noResults: key("no_results"),
    emptyState: key("empty_state"),
    loadingMaps: key("loading_maps"),
    searching: key("searching"),
    resolving: key("resolving"),
    manualCoordinates: key("manual_coordinates"),
    latitude: key("latitude"),
    longitude: key("longitude"),
    errors: {
      api_key_missing: key("errors.api_key_missing"),
      maps_load_failed: key("errors.maps_load_failed"),
      search_failed: key("errors.search_failed"),
      resolve_failed: key("errors.resolve_failed"),
      coordinate_pair_required: key("errors.coordinate_pair_required"),
      latitude_invalid: key("errors.latitude_invalid"),
      latitude_out_of_range: key("errors.latitude_out_of_range"),
      longitude_invalid: key("errors.longitude_invalid"),
      longitude_out_of_range: key("errors.longitude_out_of_range"),
    },
  };
}

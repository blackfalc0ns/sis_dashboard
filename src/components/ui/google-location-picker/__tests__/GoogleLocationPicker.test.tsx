import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoogleLocationPicker, {
  type GoogleLocationPickerLabels,
} from "../GoogleLocationPicker";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const labels: GoogleLocationPickerLabels = {
  searchLabel: "Search address",
  searchPlaceholder: "Enter an address",
  results: "Results",
  mapTitle: "Map",
  selectedLocation: "Selected location",
  noResults: "No results",
  emptyState: "No location selected",
  loadingMaps: "Loading map",
  searching: "Searching",
  resolving: "Resolving",
  manualCoordinates: "Manual coordinates",
  latitude: "Latitude",
  longitude: "Longitude",
  errors: {
    api_key_missing: "Maps API key is missing",
    maps_load_failed: "Map failed to load",
    search_failed: "Search failed",
    resolve_failed: "Location could not be resolved",
    coordinate_pair_required: "Enter both coordinates",
    latitude_invalid: "Latitude must be a number",
    latitude_out_of_range: "Latitude is out of range",
    longitude_invalid: "Longitude must be a number",
    longitude_out_of_range: "Longitude is out of range",
  },
};

describe("GoogleLocationPicker", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
  });

  it("keeps manual coordinates editable when the API key is missing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GoogleLocationPicker value={null} labels={labels} onChange={onChange} />,
    );

    expect(
      await screen.findByText(labels.errors.api_key_missing),
    ).toBeVisible();
    await user.type(screen.getByLabelText(labels.latitude), "24.7136");
    await user.type(screen.getByLabelText(labels.longitude), "46.6753");

    expect(onChange).toHaveBeenLastCalledWith({
      latitude: 24.7136,
      longitude: 46.6753,
      label: "",
      formattedAddress: "",
    });
  });

  it("reports invalid manual coordinates without replacing the value", () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();

    render(
      <GoogleLocationPicker
        value={{
          latitude: 24.7136,
          longitude: 46.6753,
          label: "School",
          formattedAddress: "Riyadh",
        }}
        labels={labels}
        onChange={onChange}
        onValidityChange={onValidityChange}
      />,
    );

    const latitude = screen.getByLabelText(labels.latitude);
    fireEvent.change(latitude, { target: { value: "91" } });

    expect(screen.getByText(labels.errors.latitude_out_of_range)).toBeVisible();
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});

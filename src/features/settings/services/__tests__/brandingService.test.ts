import { describe, expect, it } from "vitest";
import { calculateBrandingProfileCompleteness } from "../brandingService";
import type { SchoolProfileSettings } from "../../types";

const completeProfile: SchoolProfileSettings = {
  schoolName: "Al Noor School",
  shortName: "ANS",
  timezone: "Africa/Cairo",
  addressLine: "1 School Street",
  formattedAddress: "1 School Street, Cairo, Egypt",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "Al Noor School",
  logoUrl: "data:image/png;base64,logo",
  latitude: 30.0444,
  longitude: 31.2357,
  mapPlaceLabel: "Al Noor School",
};

describe("calculateBrandingProfileCompleteness", () => {
  it("requires the full approved branding profile for 100 percent", () => {
    expect(calculateBrandingProfileCompleteness(completeProfile)).toBe(100);
    expect(
      calculateBrandingProfileCompleteness({
        ...completeProfile,
        latitude: null,
      }),
    ).toBeLessThan(100);
    expect(
      calculateBrandingProfileCompleteness({
        ...completeProfile,
        longitude: null,
      }),
    ).toBeLessThan(100);
  });
});

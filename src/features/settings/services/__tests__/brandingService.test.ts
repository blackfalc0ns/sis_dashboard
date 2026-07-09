import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import {
  calculateBrandingProfileCompleteness,
  fetchBrandingProfile,
} from "../brandingService";
import type { SchoolProfileSettings } from "../../types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);

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
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

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

  it("shares concurrent branding profile requests", async () => {
    let resolveProfile: (profile: SchoolProfileSettings) => void = () => undefined;
    mockedApiGet.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );

    const firstRequest = fetchBrandingProfile({ force: true });
    const secondRequest = fetchBrandingProfile({ force: true });

    expect(mockedApiGet).toHaveBeenCalledTimes(1);

    resolveProfile(completeProfile);

    await expect(firstRequest).resolves.toEqual(completeProfile);
    await expect(secondRequest).resolves.toEqual(completeProfile);
  });
});

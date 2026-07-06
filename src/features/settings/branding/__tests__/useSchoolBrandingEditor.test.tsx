import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSchoolBrandingEditor } from "../hooks/useSchoolBrandingEditor";
import type { SchoolBrandingEditorCopy } from "../hooks/useSchoolBrandingEditor";
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

const copy: SchoolBrandingEditorCopy = {
  logoUploadFailed: "Logo failed",
  validation: {
    schoolName: "School name required",
    shortName: "Short name required",
    timezone: "Timezone required",
    addressLine: "Location required",
    city: "City required",
    country: "Country required",
    footerSignature: "Footer required",
    logoUrl: "Logo required",
  },
};

describe("useSchoolBrandingEditor", () => {
  it("edits and cancels back to the last saved profile", () => {
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({
        initialProfile: completeProfile,
        copy,
        onSave: vi.fn(),
      }),
    );

    act(() => result.current.changeText("schoolName", "Updated School"));
    expect(result.current.profile.schoolName).toBe("Updated School");
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.cancel());
    expect(result.current.profile).toEqual(completeProfile);
    expect(result.current.isDirty).toBe(false);
  });

  it("clears stale location metadata when the address is edited", () => {
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({
        initialProfile: completeProfile,
        copy,
        onSave: vi.fn(),
      }),
    );

    act(() => result.current.changeText("addressLine", "New address"));

    expect(result.current.profile).toEqual(
      expect.objectContaining({
        addressLine: "New address",
        formattedAddress: "",
        mapPlaceLabel: "",
        latitude: null,
        longitude: null,
      }),
    );
    expect(result.current.locationWasEdited).toBe(true);
  });

  it("validates every required branding field before saving", async () => {
    const onSave = vi.fn();
    const emptyProfile = Object.fromEntries(
      Object.keys(completeProfile).map((key) => [
        key,
        key === "latitude" || key === "longitude" ? null : "",
      ]),
    ) as unknown as SchoolProfileSettings;
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({ initialProfile: emptyProfile, copy, onSave }),
    );

    await act(() => result.current.save());

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual(
      expect.objectContaining(copy.validation),
    );
  });

  it("persists the complete profile and adopts the normalized response", async () => {
    const savedProfile = { ...completeProfile, schoolName: "Normalized School" };
    const onSave = vi.fn().mockResolvedValue(savedProfile);
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({
        initialProfile: completeProfile,
        copy,
        onSave,
      }),
    );

    act(() => result.current.changeText("schoolName", " Updated School "));
    await act(() => result.current.save());

    expect(onSave).toHaveBeenCalledWith({
      ...completeProfile,
      schoolName: " Updated School ",
    });
    expect(result.current.profile).toEqual(savedProfile);
    expect(result.current.isDirty).toBe(false);
  });

  it("replaces the draft and cancel baseline when the source profile changes", () => {
    const onSave = vi.fn();
    const { result, rerender } = renderHook(
      ({ profile }) =>
        useSchoolBrandingEditor({ initialProfile: profile, copy, onSave }),
      { initialProps: { profile: completeProfile } },
    );
    const refreshedProfile = { ...completeProfile, city: "Giza" };

    act(() => result.current.changeText("city", "Alexandria"));
    rerender({ profile: refreshedProfile });

    expect(result.current.profile).toEqual(refreshedProfile);
    act(() => result.current.changeText("city", "Luxor"));
    act(() => result.current.cancel());
    expect(result.current.profile).toEqual(refreshedProfile);
  });

  it("adopts and clears a confirmed school location", () => {
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({
        initialProfile: completeProfile,
        copy,
        onSave: vi.fn(),
      }),
    );

    act(() => result.current.openLocationModal());
    expect(result.current.isLocationModalOpen).toBe(true);

    act(() =>
      result.current.confirmLocation({
        label: "New Campus",
        formattedAddress: "10 Campus Road, Giza, Egypt",
        addressLine: "10 Campus Road",
        city: "Giza",
        country: "Egypt",
        latitude: 30.0131,
        longitude: 31.2089,
      }),
    );

    expect(result.current.profile).toEqual(
      expect.objectContaining({
        mapPlaceLabel: "New Campus",
        formattedAddress: "10 Campus Road, Giza, Egypt",
        latitude: 30.0131,
        longitude: 31.2089,
      }),
    );
    expect(result.current.isLocationModalOpen).toBe(false);

    act(() => result.current.clearLocation());
    expect(result.current.profile.formattedAddress).toBe("");
    expect(result.current.profile.latitude).toBeNull();
    expect(result.current.profile.longitude).toBeNull();
  });

  it("reads a selected logo into the profile", async () => {
    const { result } = renderHook(() =>
      useSchoolBrandingEditor({
        initialProfile: completeProfile,
        copy,
        onSave: vi.fn(),
      }),
    );
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await act(async () => {
      result.current.uploadLogo([file]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.profile.logoUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.current.logoError).toBe("");
  });
});

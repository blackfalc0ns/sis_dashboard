import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateBrandingProfile } from "@/features/settings/services/brandingService";
import { OrganizationSetupStep } from "../components/steps/OrganizationSetupStep";

vi.mock("@/features/settings/services/brandingService", () => ({
  updateBrandingProfile: vi.fn(),
}));

const profile = {
  schoolName: "Old School",
  shortName: "OS",
  timezone: "Africa/Cairo",
  addressLine: "Old address",
  formattedAddress: "Old formatted address",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "Regards",
  logoUrl: "https://example.test/logo.png",
  latitude: 30,
  longitude: 31,
  mapPlaceLabel: "Old place",
};

const copy = {
  summary: "Complete the school profile used across the dashboard.",
  schoolName: "School name",
  shortName: "Short name",
  timezone: "Timezone",
  addressLine: "Address",
  city: "City",
  country: "Country",
  save: "Save profile",
  saving: "Saving",
  required: "School name is required",
  saveFailed: "Could not save profile",
};

describe("OrganizationSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges edited basic fields into the fetched profile before saving", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();
    vi.mocked(updateBrandingProfile).mockResolvedValue({ ...profile, schoolName: "New School" });

    render(<OrganizationSetupStep copy={copy} profile={profile} refreshStep={refreshStep} />);

    await user.clear(screen.getByRole("textbox", { name: /School name/ }));
    await user.type(screen.getByRole("textbox", { name: /School name/ }), "New School");
    await user.clear(screen.getByRole("textbox", { name: "City" }));
    await user.type(screen.getByRole("textbox", { name: "City" }), "Giza");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(updateBrandingProfile).toHaveBeenCalledWith({
      ...profile,
      schoolName: "New School",
      city: "Giza",
    });
    await waitFor(() => expect(refreshStep).toHaveBeenCalledWith("organization"));
  });

  it("preserves edited fields when save fails", async () => {
    const user = userEvent.setup();
    vi.mocked(updateBrandingProfile).mockRejectedValue(new Error("failed"));

    render(<OrganizationSetupStep copy={copy} profile={profile} refreshStep={vi.fn()} />);

    await user.clear(screen.getByRole("textbox", { name: /School name/ }));
    await user.type(screen.getByRole("textbox", { name: /School name/ }), "Unsaved School");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Could not save profile")).toBeVisible();
    expect(screen.getByRole("textbox", { name: /School name/ })).toHaveValue("Unsaved School");
  });
});

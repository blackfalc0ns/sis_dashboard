import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SchoolBrandingEditor,
  type SchoolBrandingFormCopy,
} from "../components/SchoolBrandingEditor";
import { useSchoolBrandingEditor } from "../hooks/useSchoolBrandingEditor";
import type { SchoolProfileSettings } from "../../types";

vi.mock("../../components/SchoolLocationPickerModal", () => ({
  default: () => null,
}));

const brandingMocks = vi.hoisted(() => ({
  uploadBrandingLogo: vi.fn(),
}));

const croppedLogo = new File(["cropped"], "cropped-logo.png", {
  type: "image/png",
});

vi.mock("@/features/settings/services/brandingService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/settings/services/brandingService")>();
  return {
    ...actual,
    uploadBrandingLogo: brandingMocks.uploadBrandingLogo,
  };
});

vi.mock("@/components/ui/school-logo-crop-dialog", () => ({
  SchoolLogoCropDialog: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose(): void;
    onConfirm(file: File): Promise<boolean>;
  }) =>
    isOpen ? (
      <div>
        <p>Crop dialog</p>
        <button onClick={() => void onConfirm(croppedLogo)} type="button">
          Confirm crop
        </button>
        <button onClick={onClose} type="button">
          Cancel crop
        </button>
      </div>
    ) : null,
}));

const profile: SchoolProfileSettings = {
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

const copy: SchoolBrandingFormCopy = {
  schoolName: "School name",
  shortName: "Short name",
  timezone: "Timezone",
  address: "Address",
  city: "City",
  country: "Country",
  footerSignature: "Footer signature",
  uploadLogo: "Upload logo",
  uploadHint: "PNG or JPG, up to 2 MB",
  pickFromMap: "Pick from map",
  clearLocation: "Clear location",
  selectedLocation: "Selected location",
  noLocation: "No location selected",
  locationStale: "Select the edited address on the map",
  coordinates: (lat, lng) => `${lat}, ${lng}`,
  logoUploadFailed: "Logo failed",
  logoCrop: {
    cancel: "Cancel crop",
    confirm: "Confirm crop",
    instruction: "Crop the logo",
    preparationFailed: "Crop failed",
    preparing: "Preparing logo",
    adjustments: "Adjustments",
    background: "Background",
    backgroundCustom: "Custom color",
    backgroundTransparent: "Transparent",
    backgroundWhite: "White",
    borderColor: "Border color",
    borderWidth: "Border width",
    brightness: "Brightness",
    contrast: "Contrast",
    filter: "Filter",
    filterCool: "Cool",
    filterGrayscale: "Grayscale",
    filterOriginal: "Original",
    filterWarm: "Warm",
    frame: "Frame",
    frameCircle: "Circle",
    frameSquare: "Square",
    reset: "Reset",
    rotate: "Rotate",
    rotation: (degrees) => `${degrees} degrees`,
    saturation: "Saturation",
    title: "Crop logo",
    zoom: "Zoom",
  },
  validation: {},
};

function TestEditor() {
  const editor = useSchoolBrandingEditor({
    initialProfile: profile,
    copy,
    onSave: vi.fn(),
  });
  return <SchoolBrandingEditor copy={copy} editor={editor} />;
}

describe("SchoolBrandingEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandingMocks.uploadBrandingLogo.mockResolvedValue(profile);
  });
  it("renders the complete saved branding profile", () => {
    render(<TestEditor />);

    expect(screen.getByLabelText(copy.schoolName)).toHaveValue(profile.schoolName);
    expect(screen.getByLabelText(copy.shortName)).toHaveValue(profile.shortName);
    expect(screen.getByLabelText(copy.timezone)).toHaveTextContent(profile.timezone);
    expect(screen.getByLabelText(copy.address)).toHaveValue(profile.addressLine);
    expect(screen.getByLabelText(copy.city)).toHaveValue(profile.city);
    expect(screen.getByLabelText(copy.country)).toHaveValue(profile.country);
    expect(screen.getByLabelText(copy.footerSignature)).toHaveValue(
      profile.footerSignature,
    );
    expect(screen.getByAltText(profile.schoolName)).toHaveAttribute(
      "src",
      profile.logoUrl,
    );
    expect(screen.getByText("30.04440, 31.23570")).toBeVisible();
  });

  it("allows editing fields and clearing the selected location", async () => {
    const user = userEvent.setup();
    render(<TestEditor />);

    await user.clear(screen.getByLabelText(copy.schoolName));
    await user.type(screen.getByLabelText(copy.schoolName), "Updated School");
    expect(screen.getByLabelText(copy.schoolName)).toHaveValue("Updated School");

    await user.click(screen.getByRole("button", { name: copy.clearLocation }));
    expect(screen.getByText(copy.noLocation)).toBeVisible();
  });

  it("waits for crop confirmation before uploading a selected logo", async () => {
    const user = userEvent.setup();
    const { container } = render(<TestEditor />);
    const input = container.querySelector('input[type="file"]');

    expect(input).not.toBeNull();
    await user.upload(
      input as HTMLInputElement,
      new File(["source"], "logo.png", { type: "image/png" }),
    );

    expect(screen.getByText("Crop dialog")).toBeVisible();
    expect(brandingMocks.uploadBrandingLogo).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm crop" }));

    await waitFor(() =>
      expect(brandingMocks.uploadBrandingLogo).toHaveBeenCalledWith(croppedLogo),
    );
  });

  it("does not upload a selected logo when crop editing is cancelled", async () => {
    const user = userEvent.setup();
    const { container } = render(<TestEditor />);
    const input = container.querySelector('input[type="file"]');

    await user.upload(
      input as HTMLInputElement,
      new File(["source"], "logo.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel crop" }));

    expect(brandingMocks.uploadBrandingLogo).not.toHaveBeenCalled();
    expect(screen.getByAltText(profile.schoolName)).toHaveAttribute(
      "src",
      profile.logoUrl,
    );
  });
});

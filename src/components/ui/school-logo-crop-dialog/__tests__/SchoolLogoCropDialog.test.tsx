import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { CropPixels } from "../cropImage";
import {
  SchoolLogoCropDialog,
  type SchoolLogoCropDialogCopy,
} from "../SchoolLogoCropDialog";

const completedCrop: CropPixels = { height: 128, width: 128, x: 10, y: 10 };
const file = new File(["logo"], "school-logo.png", { type: "image/png" });
const copy: SchoolLogoCropDialogCopy = {
  adjustments: "Adjustments",
  background: "Background",
  backgroundCustom: "Custom color",
  backgroundTransparent: "Transparent",
  backgroundWhite: "White",
  borderColor: "Border color",
  borderWidth: "Border width",
  brightness: "Brightness",
  cancel: "Cancel",
  confirm: "Use logo",
  contrast: "Contrast",
  filter: "Filter",
  filterCool: "Cool",
  filterGrayscale: "Grayscale",
  filterOriginal: "Original",
  filterWarm: "Warm",
  frame: "Frame",
  frameCircle: "Circle",
  frameSquare: "Square",
  instruction: "Move, zoom, or rotate the logo before uploading it.",
  preparationFailed: "Could not prepare the selected logo.",
  preparing: "Preparing logo…",
  reset: "Reset",
  rotate: "Rotate",
  rotation: (degrees) => `Rotation: ${degrees}°`,
  saturation: "Saturation",
  title: "Crop school logo",
  zoom: "Zoom",
};

vi.mock("react-easy-crop", async () => {
  const React = await import("react");

  function MockCropper({
    image,
    onCropComplete,
  }: {
    image: string;
    onCropComplete: (_area: CropPixels, pixels: CropPixels) => void;
  }) {
    React.useEffect(
      () => onCropComplete(completedCrop, completedCrop),
      [onCropComplete],
    );
    return <div data-image={image} data-testid="cropper" />;
  }

  return { default: MockCropper };
});

class LoadedImage {
  height = 160;
  width = 240;
  private loadListener: (() => void) | null = null;

  addEventListener(type: string, listener: () => void) {
    if (type === "load") this.loadListener = listener;
  }

  set src(_value: string) {
    queueMicrotask(() => this.loadListener?.());
  }
}

describe("SchoolLogoCropDialog", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", LoadedImage);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:school-logo"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      arc: vi.fn(),
      beginPath: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      filter: "",
      fillStyle: "",
      rotate: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      strokeStyle: "",
      translate: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback, type) => callback(new Blob(["cropped"], { type })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("confirms a rotated cropped file only after the user chooses to use it", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <SchoolLogoCropDialog
        copy={copy}
        file={file}
        isOpen
        isUploading={false}
        onClose={onClose}
        onConfirm={onConfirm}
        uploadError=""
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.rotate }));
    await user.click(screen.getByRole("button", { name: copy.confirm }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "school-logo-cropped.png",
        type: "image/png",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without uploading when the user cancels", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <SchoolLogoCropDialog
        copy={copy}
        file={file}
        isOpen
        isUploading={false}
        onClose={onClose}
        onConfirm={onConfirm}
        uploadError=""
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.cancel }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without uploading when the user presses Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <SchoolLogoCropDialog
        copy={copy}
        file={file}
        isOpen
        isUploading={false}
        onClose={onClose}
        onConfirm={onConfirm}
        uploadError=""
      />,
    );

    await user.keyboard("{Escape}");

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables confirmation while uploading and announces an upload error", async () => {
    render(
      <SchoolLogoCropDialog
        copy={copy}
        file={file}
        isOpen
        isUploading
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        uploadError="Could not read the selected logo"
      />,
    );

    await screen.findByTestId("cropper");
    expect(screen.getByLabelText(copy.zoom)).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.confirm })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not read the selected logo",
    );
  });

  it("restores logo customization controls to their defaults", async () => {
    const user = userEvent.setup();

    render(
      <SchoolLogoCropDialog
        copy={copy}
        file={file}
        isOpen
        isUploading={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        uploadError=""
      />,
    );

    await user.selectOptions(screen.getByLabelText(copy.filter), "grayscale");
    await user.selectOptions(screen.getByLabelText(copy.background), "custom");
    await user.selectOptions(screen.getByLabelText(copy.frame), "circle");
    fireEvent.change(screen.getByLabelText(copy.brightness), {
      target: { value: "125" },
    });
    fireEvent.change(screen.getByLabelText(copy.borderColor), {
      target: { value: "#2563eb" },
    });
    await user.click(screen.getByRole("button", { name: copy.reset }));

    expect(screen.getByLabelText(copy.brightness)).toHaveValue("100");
    expect(screen.getByLabelText(copy.filter)).toHaveValue("original");
    expect(screen.getByLabelText(copy.background)).toHaveValue("transparent");
    expect(screen.getByLabelText(copy.frame)).toHaveValue("square");
  });

  it("keeps the active crop source valid through Strict Mode effect replay", async () => {
    vi.mocked(URL.createObjectURL)
      .mockReset()
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:active");

    render(
      <StrictMode>
        <SchoolLogoCropDialog
          copy={copy}
          file={file}
          isOpen
          isUploading={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          uploadError=""
        />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("cropper")).toHaveAttribute(
        "data-image",
        "blob:active",
      ),
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:active");
  });
});

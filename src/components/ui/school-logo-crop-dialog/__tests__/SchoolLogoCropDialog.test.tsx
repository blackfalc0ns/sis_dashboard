import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CropPixels } from "../cropImage";
import {
  SchoolLogoCropDialog,
  type SchoolLogoCropDialogCopy,
} from "../SchoolLogoCropDialog";

const completedCrop: CropPixels = { height: 128, width: 128, x: 10, y: 10 };
const file = new File(["logo"], "school-logo.png", { type: "image/png" });
const copy: SchoolLogoCropDialogCopy = {
  cancel: "Cancel",
  confirm: "Use logo",
  instruction: "Move, zoom, or rotate the logo before uploading it.",
  preparationFailed: "Could not prepare the selected logo.",
  preparing: "Preparing logo…",
  rotate: "Rotate",
  rotation: (degrees) => `Rotation: ${degrees}°`,
  title: "Crop school logo",
  zoom: "Zoom",
};

vi.mock("react-easy-crop", () => ({
  default: ({ onCropComplete }: { onCropComplete: (_area: CropPixels, pixels: CropPixels) => void }) => {
    useEffect(() => onCropComplete(completedCrop, completedCrop), [onCropComplete]);
    return <div data-testid="cropper" />;
  },
}));

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
      drawImage: vi.fn(),
      rotate: vi.fn(),
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
      expect.objectContaining({ name: "school-logo-cropped.png", type: "image/png" }),
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

  it("disables confirmation while uploading and announces an upload error", () => {
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

    expect(screen.getByLabelText(copy.zoom)).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.confirm })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not read the selected logo",
    );
  });
});

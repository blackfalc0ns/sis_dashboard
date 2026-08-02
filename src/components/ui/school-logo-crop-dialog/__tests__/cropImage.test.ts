import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCroppedImage,
  type CropPixels,
} from "../cropImage";

const crop: CropPixels = { x: 8, y: 12, width: 120, height: 120 };

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

describe("createCroppedImage", () => {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    translate: vi.fn(),
  };
  let exportedCanvas: HTMLCanvasElement | null = null;

  beforeEach(() => {
    vi.stubGlobal("Image", LoadedImage);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:school-logo"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function toBlob(callback, type) {
        exportedCanvas = this;
        callback(new Blob(["cropped"], { type }));
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    exportedCanvas = null;
  });

  it.each([
    ["image/png", "school-logo.png", "image/png", "school-logo-cropped.png"],
    ["image/jpeg", "school-logo.jpg", "image/jpeg", "school-logo-cropped.jpg"],
  ])(
    "exports a square %s crop using the source format",
    async (sourceType, sourceName, outputType, outputName) => {
      const result = await createCroppedImage(
        new File(["source"], sourceName, { type: sourceType }),
        crop,
        90,
      );

      expect(result.type).toBe(outputType);
      expect(result.name).toBe(outputName);
      expect(exportedCanvas).toEqual(
        expect.objectContaining({ height: 120, width: 120 }),
      );
      expect(context.rotate).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:school-logo");
    },
  );

  it("rejects when the canvas cannot prepare an output file", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(null),
    );

    await expect(
      createCroppedImage(
        new File(["source"], "school-logo.png", { type: "image/png" }),
        crop,
        0,
      ),
    ).rejects.toThrow("Could not prepare image");
  });
});

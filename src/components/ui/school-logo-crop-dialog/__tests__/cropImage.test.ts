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
    arc: vi.fn(),
    beginPath: vi.fn(),
    clip: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    filter: "",
    fillStyle: "",
    lineWidth: 0,
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: "",
    translate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    context.fillStyle = "";
    context.filter = "";
    context.lineWidth = 0;
    context.strokeStyle = "";
    vi.stubGlobal("Image", LoadedImage);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:school-logo"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback, type) => callback(new Blob(["cropped"], { type })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
      expect(context.drawImage).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        8,
        12,
        120,
        120,
        0,
        0,
        120,
        120,
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

  it("renders selected adjustments, a custom background, and a circular border", async () => {
    await createCroppedImage(
      new File(["source"], "school-logo.png", { type: "image/png" }),
      crop,
      0,
      {
        background: "custom",
        backgroundColor: "#2563eb",
        borderColor: "#ffffff",
        borderWidth: 8,
        brightness: 115,
        contrast: 105,
        filter: "warm",
        frame: "circle",
        saturation: 120,
      },
    );

    expect(context.filter).toBe(
      "brightness(115%) contrast(105%) saturate(120%) sepia(18%)",
    );
    expect(context.fillStyle).toBe("#2563eb");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
    expect(context.arc).toHaveBeenCalledWith(60, 60, 60, 0, Math.PI * 2);
    expect(context.strokeStyle).toBe("#ffffff");
    expect(context.lineWidth).toBe(8);
    expect(context.stroke).toHaveBeenCalledOnce();
  });

  it("flattens a transparent JPEG background to white", async () => {
    await createCroppedImage(
      new File(["source"], "school-logo.jpg", { type: "image/jpeg" }),
      crop,
      0,
      {
        background: "transparent",
        backgroundColor: "#2563eb",
        borderColor: "#ffffff",
        borderWidth: 0,
        brightness: 100,
        contrast: 100,
        filter: "original",
        frame: "square",
        saturation: 100,
      },
    );

    expect(context.fillStyle).toBe("#ffffff");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 120, 120);
  });
});

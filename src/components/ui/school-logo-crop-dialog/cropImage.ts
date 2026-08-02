export type CropPixels = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type LogoFilter = "original" | "grayscale" | "warm" | "cool";
export type LogoFrame = "square" | "circle";
export type LogoBackground = "transparent" | "white" | "custom";

export interface LogoCustomization {
  background: LogoBackground;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  brightness: number;
  contrast: number;
  filter: LogoFilter;
  frame: LogoFrame;
  saturation: number;
}

export const DEFAULT_LOGO_CUSTOMIZATION: LogoCustomization = {
  background: "transparent",
  backgroundColor: "#2563eb",
  borderColor: "#ffffff",
  borderWidth: 0,
  brightness: 100,
  contrast: 100,
  filter: "original",
  frame: "square",
  saturation: 100,
};

function getRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getRotatedSize(width: number, height: number, degrees: number) {
  const radians = getRadians(degrees);
  return {
    height:
      Math.abs(Math.sin(radians) * width) +
      Math.abs(Math.cos(radians) * height),
    width:
      Math.abs(Math.cos(radians) * width) +
      Math.abs(Math.sin(radians) * height),
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load image")));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Could not prepare image"));
    }, type);
  });
}

function createRotationCanvas(image: HTMLImageElement, rotation: number) {
  const rotatedSize = getRotatedSize(image.width, image.height, rotation);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Could not prepare image");

  canvas.width = Math.ceil(rotatedSize.width);
  canvas.height = Math.ceil(rotatedSize.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(getRadians(rotation));
  context.translate(-image.width / 2, -image.height / 2);
  context.drawImage(image, 0, 0);
  return canvas;
}

function createCropCanvas(
  sourceCanvas: HTMLCanvasElement,
  cropPixels: CropPixels,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Could not prepare image");

  canvas.width = Math.round(cropPixels.width);
  canvas.height = Math.round(cropPixels.height);
  context.drawImage(
    sourceCanvas,
    Math.round(cropPixels.x),
    Math.round(cropPixels.y),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

function getFilterValue(customization: LogoCustomization) {
  const preset = {
    cool: "hue-rotate(190deg)",
    grayscale: "grayscale(100%)",
    original: "",
    warm: "sepia(18%)",
  }[customization.filter];

  return [
    `brightness(${customization.brightness}%)`,
    `contrast(${customization.contrast}%)`,
    `saturate(${customization.saturation}%)`,
    preset,
  ]
    .filter(Boolean)
    .join(" ");
}

function getBackgroundColor(
  sourceFile: File,
  customization: LogoCustomization,
) {
  if (customization.background === "custom") {
    return customization.backgroundColor;
  }

  if (customization.background === "white" || sourceFile.type === "image/jpeg") {
    return "#ffffff";
  }

  return null;
}

function createOutputCanvas(
  sourceCanvas: HTMLCanvasElement,
  sourceFile: File,
  customization: LogoCustomization,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Could not prepare image");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const backgroundColor = getBackgroundColor(sourceFile, customization);
  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.save();
  if (customization.frame === "circle") {
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    context.clip();
  }

  context.filter = getFilterValue(customization);
  context.drawImage(sourceCanvas, 0, 0);
  context.restore();

  if (customization.borderWidth > 0) {
    context.strokeStyle = customization.borderColor;
    context.lineWidth = customization.borderWidth;

    if (customization.frame === "circle") {
      context.beginPath();
      context.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2 - customization.borderWidth / 2,
        0,
        Math.PI * 2,
      );
      context.stroke();
    } else {
      const inset = customization.borderWidth / 2;
      context.strokeRect(inset, inset, canvas.width - customization.borderWidth, canvas.height - customization.borderWidth);
    }
  }

  return canvas;
}

async function createOutputFile(
  canvas: HTMLCanvasElement,
  sourceFile: File,
) {
  const outputType =
    sourceFile.type === "image/png" ? "image/png" : "image/jpeg";
  const extension = outputType === "image/png" ? "png" : "jpg";
  const baseName = sourceFile.name.replace(/\.[^.]+$/, "") || "school-logo";
  const blob = await canvasToBlob(canvas, outputType);

  return new File([blob], `${baseName}-cropped.${extension}`, {
    type: outputType,
  });
}

export async function createCroppedImage(
  sourceFile: File,
  cropPixels: CropPixels,
  rotation: number,
  customization: LogoCustomization = DEFAULT_LOGO_CUSTOMIZATION,
): Promise<File> {
  const sourceUrl = URL.createObjectURL(sourceFile);

  try {
    const image = await loadImage(sourceUrl);
    const rotationCanvas = createRotationCanvas(image, rotation);
    const cropCanvas = createCropCanvas(rotationCanvas, cropPixels);
    const outputCanvas = createOutputCanvas(cropCanvas, sourceFile, customization);
    return createOutputFile(outputCanvas, sourceFile);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

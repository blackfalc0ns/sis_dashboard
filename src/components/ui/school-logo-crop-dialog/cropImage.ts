export type CropPixels = {
  height: number;
  width: number;
  x: number;
  y: number;
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
): Promise<File> {
  const sourceUrl = URL.createObjectURL(sourceFile);

  try {
    const image = await loadImage(sourceUrl);
    const rotationCanvas = createRotationCanvas(image, rotation);
    const cropCanvas = createCropCanvas(rotationCanvas, cropPixels);
    return createOutputFile(cropCanvas, sourceFile);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

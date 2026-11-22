export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";

export const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_INPUT_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_DIMENSION_PX = 8000;
export const MAX_TOTAL_PIXELS = 40_000_000; // 40 MP browser memory safeguard
export const MIN_QUALITY = 0.08;
export const MAX_QUALITY = 0.96;
export const DEFAULT_LOSSY_QUALITY = 0.9;
export const BINARY_SEARCH_STEPS = 9;

export interface LoadedImageInfo {
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: SupportedMimeType;
  formatLabel: string;
  width: number;
  height: number;
  hasTransparency: boolean;
  previewUrl: string;
}

export interface ProcessImageOptions {
  targetWidth: number;
  targetHeight: number;
  outputFormat: SupportedMimeType;
  targetSizeKb: number | null;
  jpegBackgroundColor: string;
}

export interface ProcessedImageResult {
  blob: Blob;
  previewUrl: string;
  filename: string;
  outputWidth: number;
  outputHeight: number;
  outputFormat: SupportedMimeType;
  outputFormatLabel: string;
  outputSizeBytes: number;
  originalSizeBytes: number;
  bytesSaved: number;
  percentReduction: number;
  targetSizeKb: number | null;
  targetMet: boolean;
  qualityUsed: number | null;
  note: string | null;
}

const EXTENSION_TO_MIME: Record<string, SupportedMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function getFormatLabel(mimeType: SupportedMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
  }
}

export function getFormatExtension(mimeType: SupportedMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function detectSupportedMimeType(file: File): SupportedMimeType | null {
  if (SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    return file.type as SupportedMimeType;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_MIME[ext] ?? null;
}

export function validateDimensions(
  width: number,
  height: number
): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return "Please enter valid numeric dimensions.";
  }
  if (width < 1 || height < 1) {
    return "Width and height must each be at least 1 pixel.";
  }
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    return `Dimensions cannot exceed ${MAX_DIMENSION_PX.toLocaleString()} pixels on either side.`;
  }
  if (width * height > MAX_TOTAL_PIXELS) {
    return "Requested pixel dimensions are too large for reliable browser memory usage.";
  }
  return null;
}

export function buildOutputFilename(
  originalName: string,
  width: number,
  height: number,
  outputFormat: SupportedMimeType
): string {
  const dotIndex = originalName.lastIndexOf(".");
  const rawStem = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const cleanStem =
    rawStem
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "binro-image";
  const ext = getFormatExtension(outputFormat);
  return `${cleanStem}-${width}x${height}.${ext}`;
}

async function decodeFileToDrawable(
  file: File
): Promise<{
  drawable: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        drawable: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return {
          drawable: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        };
      } catch {
        // Fallback to HTMLImageElement below.
      }
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("Could not decode the selected image file."));
      element.src = objectUrl;
    });

    return {
      drawable: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function detectTransparency(
  drawable: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number
): boolean {
  const sampleMax = 96;
  const scale = Math.min(1, sampleMax / Math.max(sourceWidth, sourceHeight));
  const sampleW = Math.max(1, Math.round(sourceWidth * scale));
  const sampleH = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.clearRect(0, 0, sampleW, sampleH);
  ctx.drawImage(drawable, 0, 0, sampleW, sampleH);

  const pixels = ctx.getImageData(0, 0, sampleW, sampleH).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 252) {
      return true;
    }
  }
  return false;
}

export async function inspectSelectedImage(
  file: File
): Promise<LoadedImageInfo> {
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error(
      `This file exceeds the ${Math.round(MAX_INPUT_FILE_BYTES / (1024 * 1024))} MB limit for reliable in-browser processing.`
    );
  }

  const mimeType = detectSupportedMimeType(file);
  if (!mimeType) {
    throw new Error(
      "Unsupported file format. Please choose a JPG, JPEG, PNG, or WebP image."
    );
  }

  const decoded = await decodeFileToDrawable(file);
  try {
    if (decoded.width < 1 || decoded.height < 1) {
      throw new Error("The selected image has invalid dimensions.");
    }

    const canHaveAlpha = mimeType === "image/png" || mimeType === "image/webp";
    const hasTransparency = canHaveAlpha
      ? detectTransparency(decoded.drawable, decoded.width, decoded.height)
      : false;

    const previewUrl = URL.createObjectURL(file);

    return {
      file,
      name: file.name,
      sizeBytes: file.size,
      mimeType,
      formatLabel: getFormatLabel(mimeType),
      width: decoded.width,
      height: decoded.height,
      hasTransparency,
      previewUrl,
    };
  } finally {
    decoded.cleanup();
  }
}

function renderResizedCanvas(
  drawable: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  outputFormat: SupportedMimeType,
  backgroundColor: string
): HTMLCanvasElement {
  let currentSource: CanvasImageSource = drawable;
  let currentW = sourceWidth;
  let currentH = sourceHeight;
  const intermediateCanvases: HTMLCanvasElement[] = [];

  // Progressive downscale in 50% steps when shrinking substantially to keep photos & signatures crisp.
  let steps = 0;
  while (
    (currentW * 0.5 > targetWidth || currentH * 0.5 > targetHeight) &&
    steps < 5
  ) {
    const nextW = Math.max(targetWidth, Math.round(currentW * 0.5));
    const nextH = Math.max(targetHeight, Math.round(currentH * 0.5));
    const stepCanvas = document.createElement("canvas");
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext("2d");
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = "high";
    stepCtx.drawImage(currentSource, 0, 0, nextW, nextH);
    intermediateCanvases.push(stepCanvas);
    currentSource = stepCanvas;
    currentW = nextW;
    currentH = nextH;
    steps += 1;
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialise browser canvas context.");
  }

  if (outputFormat === "image/jpeg") {
    ctx.fillStyle = backgroundColor || "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);

  // Release intermediate canvas buffers promptly.
  for (const temp of intermediateCanvases) {
    temp.width = 0;
    temp.height = 0;
  }

  return outputCanvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: SupportedMimeType,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Browser failed to encode the processed image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function processImageInBrowser(
  source: LoadedImageInfo,
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  const width = Math.round(options.targetWidth);
  const height = Math.round(options.targetHeight);

  const dimensionError = validateDimensions(width, height);
  if (dimensionError) {
    throw new Error(dimensionError);
  }

  const targetBytes =
    options.targetSizeKb !== null && options.targetSizeKb > 0
      ? Math.round(options.targetSizeKb * 1024)
      : null;

  const decoded = await decodeFileToDrawable(source.file);
  let canvas: HTMLCanvasElement | null = null;

  try {
    canvas = renderResizedCanvas(
      decoded.drawable,
      decoded.width,
      decoded.height,
      width,
      height,
      options.outputFormat,
      options.jpegBackgroundColor
    );

    let finalBlob: Blob;
    let targetMet = true;
    let qualityUsed: number | null = null;
    let note: string | null = null;

    if (options.outputFormat === "image/png") {
      finalBlob = await canvasToBlob(canvas, "image/png");
      if (targetBytes !== null) {
        targetMet = finalBlob.size <= targetBytes;
        if (!targetMet) {
          note =
            "PNG uses lossless compression and ignores quality reduction. Switch the output format to JPEG or WebP, or reduce the pixel dimensions, to reach a smaller file size.";
        }
      }
    } else if (targetBytes === null) {
      qualityUsed = DEFAULT_LOSSY_QUALITY;
      finalBlob = await canvasToBlob(canvas, options.outputFormat, qualityUsed);
    } else {
      // Test highest quality first.
      const highBlob = await canvasToBlob(
        canvas,
        options.outputFormat,
        MAX_QUALITY
      );

      if (highBlob.size <= targetBytes) {
        finalBlob = highBlob;
        qualityUsed = MAX_QUALITY;
        targetMet = true;
      } else {
        // Check minimum acceptable quality floor before searching.
        const lowBlob = await canvasToBlob(
          canvas,
          options.outputFormat,
          MIN_QUALITY
        );

        if (lowBlob.size > targetBytes) {
          finalBlob = lowBlob;
          qualityUsed = MIN_QUALITY;
          targetMet = false;
          note = `At ${width} × ${height} px, the smallest acceptable ${getFormatLabel(options.outputFormat)} file is ${formatBytes(lowBlob.size)}, which is above your ${options.targetSizeKb} KB target. Try reducing the pixel dimensions or raising the target size.`;
        } else {
          // Bounded binary search for highest quality that fits within targetBytes.
          let low = MIN_QUALITY;
          let high = MAX_QUALITY;
          let bestBlob = lowBlob;
          let bestQuality = MIN_QUALITY;

          for (let step = 0; step < BINARY_SEARCH_STEPS; step += 1) {
            const mid = Number(((low + high) / 2).toFixed(3));
            const candidate = await canvasToBlob(
              canvas,
              options.outputFormat,
              mid
            );
            if (candidate.size <= targetBytes) {
              bestBlob = candidate;
              bestQuality = mid;
              low = mid;
            } else {
              high = mid;
            }
          }

          finalBlob = bestBlob;
          qualityUsed = bestQuality;
          targetMet = true;
        }
      }
    }

    const previewUrl = URL.createObjectURL(finalBlob);
    const bytesSaved = source.sizeBytes - finalBlob.size;
    const percentReduction =
      source.sizeBytes > 0 && bytesSaved > 0
        ? Math.round((bytesSaved / source.sizeBytes) * 100)
        : 0;

    return {
      blob: finalBlob,
      previewUrl,
      filename: buildOutputFilename(
        source.name,
        width,
        height,
        options.outputFormat
      ),
      outputWidth: width,
      outputHeight: height,
      outputFormat: options.outputFormat,
      outputFormatLabel: getFormatLabel(options.outputFormat),
      outputSizeBytes: finalBlob.size,
      originalSizeBytes: source.sizeBytes,
      bytesSaved,
      percentReduction,
      targetSizeKb: options.targetSizeKb,
      targetMet,
      qualityUsed,
      note,
    };
  } finally {
    decoded.cleanup();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

"use client";

import {
  MAX_CONVERT_DIMENSION_PX,
  MAX_CONVERT_PIXELS,
  SUPPORTED_IMAGE_MIME_LABELS,
  buildPdfFromPreparedImages,
  detectImageMimeFromMagicBytes,
  isAnimatedGifBytes,
  readJpegExifOrientation,
  validateImageFileMetadata,
  type ImagePdfSettings,
  type ImageRotationDegrees,
  type ImageToPdfProgress,
  type ImageToPdfResult,
  type PreparedPdfImage,
  type SupportedImageToPdfMime,
} from "./image-to-pdf-core";

export interface InspectedPdfImage {
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: SupportedImageToPdfMime;
  formatLabel: string;
  width: number;
  height: number;
  hasTransparency: boolean;
  isAnimatedGif: boolean;
  exifOrientation: number;
  previewUrl: string;
}

export interface QueuedPdfImageInput {
  file: File;
  name: string;
  mimeType: SupportedImageToPdfMime;
  hasTransparency: boolean;
  exifOrientation: number;
  rotation: ImageRotationDegrees;
}

function getSafeCanvasDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  let targetW = Math.max(1, Math.round(width));
  let targetH = Math.max(1, Math.round(height));

  const maxSide = Math.max(targetW, targetH);
  if (maxSide > MAX_CONVERT_DIMENSION_PX) {
    const scale = MAX_CONVERT_DIMENSION_PX / maxSide;
    targetW = Math.max(1, Math.round(targetW * scale));
    targetH = Math.max(1, Math.round(targetH * scale));
  }

  const totalPixels = targetW * targetH;
  if (totalPixels > MAX_CONVERT_PIXELS) {
    const scale = Math.sqrt(MAX_CONVERT_PIXELS / totalPixels);
    targetW = Math.max(1, Math.round(targetW * scale));
    targetH = Math.max(1, Math.round(targetH * scale));
  }

  return { width: targetW, height: targetH };
}

async function decodeImageFile(
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
        reject(new Error(`Could not decode "${file.name}" in this browser.`));
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

function detectCanvasTransparency(
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
  canvas.width = 0;
  canvas.height = 0;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 252) {
      return true;
    }
  }
  return false;
}

function canvasToUint8Array(
  canvas: HTMLCanvasElement,
  mimeType: "image/png" | "image/jpeg",
  quality?: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Browser failed to encode the image for PDF embedding."));
          return;
        }
        try {
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        } catch {
          reject(new Error("Failed to read encoded image bytes."));
        }
      },
      mimeType,
      quality
    );
  });
}

async function renderDrawableToBytes(
  drawable: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  rotation: ImageRotationDegrees,
  outputFormat: "png" | "jpeg"
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const swapAxes = rotation === 90 || rotation === 270;
  const rawOutW = swapAxes ? sourceHeight : sourceWidth;
  const rawOutH = swapAxes ? sourceWidth : sourceHeight;
  const { width: outW, height: outH } = getSafeCanvasDimensions(
    rawOutW,
    rawOutH
  );

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialise browser canvas context.");
  }

  try {
    if (outputFormat === "jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, outW, outH);
    } else {
      ctx.clearRect(0, 0, outW, outH);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = swapAxes ? outH : outW;
    const drawH = swapAxes ? outW : outH;
    ctx.drawImage(drawable, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const bytes = await canvasToUint8Array(
      canvas,
      outputFormat === "jpeg" ? "image/jpeg" : "image/png",
      outputFormat === "jpeg" ? 0.92 : undefined
    );

    return { bytes, width: outW, height: outH };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function inspectImageForPdf(
  file: File
): Promise<InspectedPdfImage> {
  const metaError = validateImageFileMetadata(file);
  if (metaError) {
    throw new Error(metaError);
  }

  const headerSlice = new Uint8Array(
    await file.slice(0, Math.min(file.size, 256 * 1024)).arrayBuffer()
  );
  const detectedMime = detectImageMimeFromMagicBytes(headerSlice);
  if (!detectedMime) {
    throw new Error(
      `"${file.name}" is not a supported image file. Please select a valid JPG, JPEG, PNG, WebP, BMP, or GIF image.`
    );
  }

  let isAnimatedGif = false;
  if (detectedMime === "image/gif") {
    const fullBytes = new Uint8Array(await file.arrayBuffer());
    isAnimatedGif = isAnimatedGifBytes(fullBytes);
  }

  const exifOrientation =
    detectedMime === "image/jpeg" ? readJpegExifOrientation(headerSlice) : 1;

  const decoded = await decodeImageFile(file);
  try {
    if (decoded.width < 1 || decoded.height < 1) {
      throw new Error(`"${file.name}" has invalid image dimensions.`);
    }

    const canHaveAlpha =
      detectedMime === "image/png" ||
      detectedMime === "image/webp" ||
      detectedMime === "image/gif" ||
      detectedMime === "image/bmp";
    const hasTransparency = canHaveAlpha
      ? detectCanvasTransparency(decoded.drawable, decoded.width, decoded.height)
      : false;

    const previewUrl = URL.createObjectURL(file);

    return {
      file,
      name: file.name,
      sizeBytes: file.size,
      mimeType: detectedMime,
      formatLabel: SUPPORTED_IMAGE_MIME_LABELS[detectedMime],
      width: decoded.width,
      height: decoded.height,
      hasTransparency,
      isAnimatedGif,
      exifOrientation,
      previewUrl,
    };
  } finally {
    decoded.cleanup();
  }
}

async function prepareSingleImageForPdf(
  item: QueuedPdfImageInput
): Promise<PreparedPdfImage> {
  // Direct lossless embedding for unrotated normal-orientation JPEG & PNG
  if (
    item.mimeType === "image/jpeg" &&
    item.rotation === 0 &&
    item.exifOrientation === 1
  ) {
    const bytes = new Uint8Array(await item.file.arrayBuffer());
    return {
      name: item.name,
      embedFormat: "jpeg",
      bytes,
      width: 1,
      height: 1,
    };
  }

  if (item.mimeType === "image/png" && item.rotation === 0) {
    const bytes = new Uint8Array(await item.file.arrayBuffer());
    return {
      name: item.name,
      embedFormat: "png",
      bytes,
      width: 1,
      height: 1,
    };
  }

  // Decode via browser engine (respecting EXIF orientation) and render rotated/converted bytes
  const decoded = await decodeImageFile(item.file);
  try {
    // Prefer lossless PNG for PNG, transparent images, GIF, BMP, and WebP so transparency and quality stay intact.
    // For rotated opaque JPEGs, re-encode at high quality JPEG to avoid excessive file bloat.
    const outputFormat: "png" | "jpeg" =
      item.mimeType === "image/jpeg" ? "jpeg" : "png";

    const rendered = await renderDrawableToBytes(
      decoded.drawable,
      decoded.width,
      decoded.height,
      item.rotation,
      outputFormat
    );

    return {
      name: item.name,
      embedFormat: outputFormat,
      bytes: rendered.bytes,
      width: rendered.width,
      height: rendered.height,
    };
  } finally {
    decoded.cleanup();
  }
}

export async function convertImagesToPdfInBrowser(
  items: QueuedPdfImageInput[],
  settings: ImagePdfSettings,
  onProgress?: (progress: ImageToPdfProgress) => void
): Promise<ImageToPdfResult> {
  if (items.length === 0) {
    throw new Error("Select at least one image to convert.");
  }

  const prepared: PreparedPdfImage[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    onProgress?.({
      stage: "preparing",
      detail: `Preparing image ${i + 1} of ${items.length}`,
    });
    prepared.push(await prepareSingleImageForPdf(item));
  }

  return buildPdfFromPreparedImages(prepared, settings, onProgress);
}

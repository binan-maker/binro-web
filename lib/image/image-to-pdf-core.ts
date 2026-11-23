import { PDFDocument, type PDFImage } from "pdf-lib";

export type SupportedImageToPdfMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/bmp"
  | "image/gif";

export type PdfPageSizeOption = "a4" | "letter" | "fit";
export type PdfOrientationOption = "auto" | "portrait" | "landscape";
export type PdfMarginOption = "none" | "small" | "large";
export type PdfImagePlacementOption = "fit";
export type ImageRotationDegrees = 0 | 90 | 180 | 270;

export const MAX_IMAGES_PER_PDF = 50;
export const MAX_SINGLE_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_TOTAL_IMAGE_BYTES = 150 * 1024 * 1024; // 150 MB
export const MAX_CONVERT_DIMENSION_PX = 8000;
export const MAX_CONVERT_PIXELS = 40_000_000;

export const A4_DIMENSIONS_PT = { width: 595.28, height: 841.89 } as const;
export const LETTER_DIMENSIONS_PT = { width: 612, height: 792 } as const;

export const MARGIN_POINTS: Record<PdfMarginOption, number> = {
  none: 0,
  small: 24,
  large: 54,
};

const MIN_FIT_PAGE_PT = 72;
const MAX_FIT_PAGE_PT = 14400; // PDF 1.7 page boundary limit
const PX_TO_PT = 0.75; // 96 DPI -> 72 pt/in

export interface ImagePdfSettings {
  pageSize: PdfPageSizeOption;
  orientation: PdfOrientationOption;
  margin: PdfMarginOption;
  placement: PdfImagePlacementOption;
}

export interface PreparedPdfImage {
  name: string;
  embedFormat: "jpeg" | "png";
  bytes: Uint8Array;
  width: number;
  height: number;
}

export interface ImageToPdfProgress {
  stage: "preparing" | "generating" | "verifying";
  detail: string;
}

export interface ImageToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  outputSizeBytes: number;
}

export const SUPPORTED_IMAGE_MIME_LABELS: Record<
  SupportedImageToPdfMime,
  string
> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/bmp": "BMP",
  "image/gif": "GIF",
};

export function formatFileBytes(bytes: number): string {
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

export function sanitizeImagePdfFilename(rawName: string): string {
  const trimmed = rawName.trim().replace(/\.pdf$/i, "");
  const safeStem = trimmed
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safeStem || "binro-images"}.pdf`;
}

export function validatePdfHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const searchLimit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= searchLimit - 5; i += 1) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Detect actual image format from file magic bytes rather than trusting filename extension.
 */
export function detectImageMimeFromMagicBytes(
  bytes: Uint8Array
): SupportedImageToPdfMime | null {
  if (bytes.length < 2) return null;

  // JPEG: FF D8 FF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && // G
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x38 && // 8
    (bytes[4] === 0x37 || bytes[4] === 0x39) && // 7 or 9
    bytes[5] === 0x61 // a
  ) {
    return "image/gif";
  }

  // BMP: BM (42 4D) with plausible minimum DIB header size (>= 26 bytes)
  if (bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }

  return null;
}

/**
 * Inspect a GIF byte buffer to detect whether it contains multiple image frames.
 */
export function isAnimatedGifBytes(bytes: Uint8Array): boolean {
  if (detectImageMimeFromMagicBytes(bytes) !== "image/gif") {
    return false;
  }
  if (bytes.length < 14) return false;

  let offset = 6;
  const packedField = bytes[10];
  offset += 7; // Logical Screen Descriptor (7 bytes)
  if ((packedField & 0x80) !== 0) {
    const gctSize = 3 * (1 << ((packedField & 0x07) + 1));
    offset += gctSize;
  }

  let frameCount = 0;
  while (offset < bytes.length) {
    const blockId = bytes[offset];
    if (blockId === 0x3b) {
      // Trailer
      break;
    }
    if (blockId === 0x2c) {
      // Image Descriptor
      frameCount += 1;
      if (frameCount > 1) return true;
      if (offset + 10 > bytes.length) break;
      const imgPacked = bytes[offset + 9];
      offset += 10;
      if ((imgPacked & 0x80) !== 0) {
        const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
        offset += lctSize;
      }
      if (offset >= bytes.length) break;
      offset += 1; // LZW Minimum Code Size
      while (offset < bytes.length) {
        const subBlockLen = bytes[offset];
        offset += 1;
        if (subBlockLen === 0) break;
        offset += subBlockLen;
      }
    } else if (blockId === 0x21) {
      // Extension block
      offset += 2; // 0x21 + label
      while (offset < bytes.length) {
        const subBlockLen = bytes[offset];
        offset += 1;
        if (subBlockLen === 0) break;
        offset += subBlockLen;
      }
    } else {
      break;
    }
  }

  return false;
}

/**
 * Parse the EXIF Orientation tag (1..8) from JPEG bytes, returning 1 if absent or normal.
 */
export function readJpegExifOrientation(bytes: Uint8Array): number {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return 1;
  }

  let offset = 2;
  const maxScan = Math.min(bytes.length, 256 * 1024);

  while (offset + 4 <= maxScan) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    if (offset + 2 > maxScan) break;
    const segLen = (bytes[offset] << 8) | bytes[offset + 1];
    if (segLen < 2 || offset + segLen > bytes.length) break;

    if (marker === 0xe1 && segLen >= 16) {
      // Check "Exif\0\0"
      if (
        bytes[offset + 2] === 0x45 &&
        bytes[offset + 3] === 0x78 &&
        bytes[offset + 4] === 0x69 &&
        bytes[offset + 5] === 0x66 &&
        bytes[offset + 6] === 0x00 &&
        bytes[offset + 7] === 0x00
      ) {
        const tiffStart = offset + 8;
        const littleEndian =
          bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
        const bigEndian =
          bytes[tiffStart] === 0x4d && bytes[tiffStart + 1] === 0x4d;
        if (!littleEndian && !bigEndian) return 1;

        const readU16 = (pos: number) =>
          littleEndian
            ? bytes[pos] | (bytes[pos + 1] << 8)
            : (bytes[pos] << 8) | bytes[pos + 1];
        const readU32 = (pos: number) =>
          littleEndian
            ? (bytes[pos] |
                (bytes[pos + 1] << 8) |
                (bytes[pos + 2] << 16) |
                (bytes[pos + 3] << 24)) >>>
              0
            : ((bytes[pos] << 24) |
                (bytes[pos + 1] << 16) |
                (bytes[pos + 2] << 8) |
                bytes[pos + 3]) >>>
              0;

        if (tiffStart + 8 > bytes.length) return 1;
        const ifdOffset = readU32(tiffStart + 4);
        const ifdStart = tiffStart + ifdOffset;
        if (ifdStart + 2 > bytes.length) return 1;

        const entryCount = readU16(ifdStart);
        for (let i = 0; i < entryCount; i += 1) {
          const entryPos = ifdStart + 2 + i * 12;
          if (entryPos + 12 > bytes.length) break;
          const tag = readU16(entryPos);
          if (tag === 0x0112) {
            const val = readU16(entryPos + 8);
            return val >= 1 && val <= 8 ? val : 1;
          }
        }
      }
    }

    offset += segLen;
  }

  return 1;
}

export function validateImageFileMetadata(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return `"${file.name}" is empty and cannot be converted.`;
  }
  if (file.size > MAX_SINGLE_IMAGE_BYTES) {
    const maxMb = Math.round(MAX_SINGLE_IMAGE_BYTES / (1024 * 1024));
    return `"${file.name}" exceeds the ${maxMb} MB per-image limit for reliable browser processing.`;
  }

  const normalizedType = file.type.toLowerCase();
  const hasExplicitUnsupportedMime =
    normalizedType.length > 0 &&
    !normalizedType.startsWith("image/") &&
    normalizedType !== "application/octet-stream";

  if (hasExplicitUnsupportedMime) {
    return `"${file.name}" is not a supported image file. Supported formats: JPG, JPEG, PNG, WebP, BMP, and GIF.`;
  }

  return null;
}

export interface PagePlacementGeometry {
  pageWidth: number;
  pageHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
}

export function computeImagePageGeometry(
  imageWidth: number,
  imageHeight: number,
  settings: ImagePdfSettings
): PagePlacementGeometry {
  const safeImgW = Math.max(1, imageWidth);
  const safeImgH = Math.max(1, imageHeight);
  const marginPt = MARGIN_POINTS[settings.margin];

  if (settings.pageSize === "fit") {
    let contentW = safeImgW * PX_TO_PT;
    let contentH = safeImgH * PX_TO_PT;

    const maxContentPt = MAX_FIT_PAGE_PT - marginPt * 2;
    const maxSide = Math.max(contentW, contentH);
    if (maxSide > maxContentPt) {
      const shrink = maxContentPt / maxSide;
      contentW *= shrink;
      contentH *= shrink;
    }

    const minSide = Math.min(contentW, contentH);
    if (minSide < MIN_FIT_PAGE_PT) {
      const grow = Math.min(
        MIN_FIT_PAGE_PT / minSide,
        maxContentPt / Math.max(contentW, contentH)
      );
      contentW *= grow;
      contentH *= grow;
    }

    const pageWidth = Number((contentW + marginPt * 2).toFixed(2));
    const pageHeight = Number((contentH + marginPt * 2).toFixed(2));

    return {
      pageWidth,
      pageHeight,
      drawX: Number(marginPt.toFixed(2)),
      drawY: Number(marginPt.toFixed(2)),
      drawWidth: Number(contentW.toFixed(2)),
      drawHeight: Number(contentH.toFixed(2)),
    };
  }

  const base =
    settings.pageSize === "letter" ? LETTER_DIMENSIONS_PT : A4_DIMENSIONS_PT;
  const shortSide = Math.min(base.width, base.height);
  const longSide = Math.max(base.width, base.height);

  const useLandscape =
    settings.orientation === "landscape"
      ? true
      : settings.orientation === "portrait"
        ? false
        : safeImgW > safeImgH;

  const pageWidth = useLandscape ? longSide : shortSide;
  const pageHeight = useLandscape ? shortSide : longSide;

  const availW = Math.max(1, pageWidth - marginPt * 2);
  const availH = Math.max(1, pageHeight - marginPt * 2);

  // Fit preserves the complete aspect ratio with zero cropping or stretching.
  const scale = Math.min(availW / safeImgW, availH / safeImgH);
  const drawWidth = safeImgW * scale;
  const drawHeight = safeImgH * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;

  return {
    pageWidth: Number(pageWidth.toFixed(2)),
    pageHeight: Number(pageHeight.toFixed(2)),
    drawX: Number(drawX.toFixed(2)),
    drawY: Number(drawY.toFixed(2)),
    drawWidth: Number(drawWidth.toFixed(2)),
    drawHeight: Number(drawHeight.toFixed(2)),
  };
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function buildPdfFromPreparedImages(
  images: PreparedPdfImage[],
  settings: ImagePdfSettings,
  onProgress?: (progress: ImageToPdfProgress) => void
): Promise<ImageToPdfResult> {
  if (images.length === 0) {
    throw new Error("Select at least one image to convert to PDF.");
  }

  onProgress?.({
    stage: "generating",
    detail: `Creating ${images.length} ${images.length === 1 ? "page" : "pages"}`,
  });

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setCreator("BinRo Image to PDF");
  pdfDoc.setProducer("BinRo Image to PDF");

  for (let i = 0; i < images.length; i += 1) {
    const item = images[i];

    onProgress?.({
      stage: "generating",
      detail: `Embedding image ${i + 1} of ${images.length}`,
    });

    let embedded: PDFImage;
    try {
      embedded =
        item.embedFormat === "jpeg"
          ? await pdfDoc.embedJpg(item.bytes)
          : await pdfDoc.embedPng(item.bytes);
    } catch {
      throw new Error(
        `Could not embed "${item.name}" into the PDF. Please verify the image file is not damaged.`
      );
    }

    const geometry = computeImagePageGeometry(
      embedded.width || item.width,
      embedded.height || item.height,
      settings
    );

    const page = pdfDoc.addPage([geometry.pageWidth, geometry.pageHeight]);
    page.drawImage(embedded, {
      x: geometry.drawX,
      y: geometry.drawY,
      width: geometry.drawWidth,
      height: geometry.drawHeight,
    });

    if (i % 3 === 2 || images.length <= 12) {
      await yieldToEventLoop();
    }
  }

  onProgress?.({
    stage: "verifying",
    detail: "Finalising and verifying PDF",
  });
  await yieldToEventLoop();

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
  });

  if (!validatePdfHeader(pdfBytes)) {
    throw new Error("Generated PDF failed header validation.");
  }

  const verifiedDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  });
  const verifiedPages = verifiedDoc.getPageCount();
  if (verifiedPages !== images.length) {
    throw new Error(
      `PDF verification failed: expected ${images.length} pages but created ${verifiedPages}.`
    );
  }

  return {
    pdfBytes,
    pageCount: verifiedPages,
    outputSizeBytes: pdfBytes.length,
  };
}

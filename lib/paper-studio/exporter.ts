"use client";

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import {
  MM_TO_CSS_PX,
  normalizeStudioSettings,
  sanitizeExportFilename,
  type PaperStudioSettings,
} from "./config";
import { ensureHandwritingFontLoaded, getHandwritingFont } from "./fonts";
import type { PaginatedDocument, PaginatedPage } from "./pagination";

export interface ExportProgress {
  stage: "loading-fonts" | "rendering" | "building-pdf" | "packaging" | "verifying";
  currentPage: number;
  totalPages: number;
  detail: string;
}

export interface PdfExportResult {
  bytes: Uint8Array;
  pageCount: number;
  filename: string;
}

export interface PngExportResult {
  blob: Blob;
  filename: string;
  widthPx: number;
  heightPx: number;
}

export interface ZipPngExportResult {
  blob: Blob;
  filename: string;
  pageCount: number;
}

const MAX_EXPORT_CANVAS_PIXELS = 12_000_000; // Keeps per-page canvas safe on mobile Safari/Chrome

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function validatePdfHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/**
 * Compute a safe export scale factor (relative to 96 CSS DPI) that yields
 * sharp print quality while staying within mobile browser canvas memory limits.
 */
export function computeSafeExportScale(
  pageWidthPx: number,
  pageHeightPx: number,
  preferredScale = 2.5
): number {
  const safeBasePixels = Math.max(1, pageWidthPx * pageHeightPx);
  const maxScaleByPixels = Math.sqrt(MAX_EXPORT_CANVAS_PIXELS / safeBasePixels);
  return Math.max(1.25, Math.min(preferredScale, maxScaleByPixels));
}

function drawPaperBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  page: PaginatedPage,
  settings: PaperStudioSettings
) {
  const w = page.widthPx;
  const h = page.heightPx;

  // Base paper background color
  ctx.fillStyle = settings.paperColor;
  ctx.fillRect(0, 0, w, h);

  const ruleSpacingPx = settings.ruleSpacingMm * MM_TO_CSS_PX;
  const gridSpacingPx = settings.gridSpacingMm * MM_TO_CSS_PX;
  const firstRuleY = Math.max(10, page.contentRect.top);

  if (settings.paperType === "ruled" || settings.paperType === "college") {
    ctx.strokeStyle = settings.ruleColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = firstRuleY; y < h - 8; y += ruleSpacingPx) {
      const snappedY = Math.round(y) + 0.5;
      ctx.moveTo(0, snappedY);
      ctx.lineTo(w, snappedY);
    }
    ctx.stroke();

    if (settings.showMarginLine) {
      const marginLineX = Math.max(24, page.contentRect.left - 10);
      ctx.strokeStyle = settings.marginLineColor;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      const snappedX = Math.round(marginLineX) + 0.5;
      ctx.moveTo(snappedX, 0);
      ctx.lineTo(snappedX, h);
      ctx.stroke();
    }
  } else if (settings.paperType === "grid") {
    ctx.strokeStyle = settings.ruleColor;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    for (let x = gridSpacingPx; x < w; x += gridSpacingPx) {
      const snappedX = Math.round(x) + 0.5;
      ctx.moveTo(snappedX, 0);
      ctx.lineTo(snappedX, h);
    }
    for (let y = gridSpacingPx; y < h; y += gridSpacingPx) {
      const snappedY = Math.round(y) + 0.5;
      ctx.moveTo(0, snappedY);
      ctx.lineTo(w, snappedY);
    }
    ctx.stroke();

    if (settings.showMarginLine) {
      const marginLineX = Math.max(24, page.contentRect.left - 10);
      ctx.strokeStyle = settings.marginLineColor;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      const snappedX = Math.round(marginLineX) + 0.5;
      ctx.moveTo(snappedX, 0);
      ctx.lineTo(snappedX, h);
      ctx.stroke();
    }
  } else if (settings.paperType === "dotted") {
    ctx.fillStyle = settings.ruleColor;
    const dotRadius = 0.95;
    for (let y = gridSpacingPx * 0.5; y < h; y += gridSpacingPx) {
      for (let x = gridSpacingPx * 0.5; x < w; x += gridSpacingPx) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (settings.showMarginLine) {
    const marginLineX = Math.max(24, page.contentRect.left - 10);
    ctx.strokeStyle = settings.marginLineColor;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    const snappedX = Math.round(marginLineX) + 0.5;
    ctx.moveTo(snappedX, 0);
    ctx.lineTo(snappedX, h);
    ctx.stroke();
  }
}

function drawPageTextToCanvas(
  ctx: CanvasRenderingContext2D,
  page: PaginatedPage,
  settings: PaperStudioSettings
) {
  const font = getHandwritingFont(settings.fontId);

  ctx.save();
  // Clip strictly inside printable bounds
  ctx.beginPath();
  ctx.rect(0, 0, page.widthPx, page.heightPx);
  ctx.clip();

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = settings.inkColor;
  ctx.strokeStyle = settings.inkColor;

  for (const line of page.lines) {
    const baseY = line.y + line.baselineOffsetPx + line.variation.baselineShiftPx;
    ctx.globalAlpha = line.variation.inkOpacity;

    if (line.listMarker && line.listMarkerX !== undefined) {
      ctx.font = `400 ${line.fontSizePx}px "${font.family}", cursive`;
      ctx.fillText(line.listMarker, line.listMarkerX, baseY);
    }

    for (const word of line.words) {
      const wordY = baseY + word.baselineShiftPx;

      for (const seg of word.segments) {
        const segX = word.x + seg.offsetX;
        const weight = seg.bold ? font.boldWeight : 400;
        ctx.font = `${seg.italic ? "italic " : ""}${weight} ${line.fontSizePx}px "${font.family}", cursive`;
        ctx.fillText(seg.text, segX, wordY);

        if (seg.underline && seg.text.trim().length > 0) {
          const underlineY = wordY + Math.max(1.5, line.fontSizePx * 0.12);
          ctx.lineWidth = Math.max(1, line.fontSizePx * 0.055);
          ctx.beginPath();
          ctx.moveTo(segX, underlineY);
          ctx.lineTo(segX + seg.widthPx, underlineY);
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
}

export async function renderPageToCanvas(
  page: PaginatedPage,
  rawSettings: PaperStudioSettings,
  preferredScale = 2.5
): Promise<{ canvas: HTMLCanvasElement; scale: number }> {
  const settings = normalizeStudioSettings(rawSettings);
  const scale = computeSafeExportScale(page.widthPx, page.heightPx, preferredScale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(page.widthPx * scale));
  canvas.height = Math.max(1, Math.round(page.heightPx * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    throw new Error("Could not initialize browser canvas context for export.");
  }

  ctx.save();
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawPaperBackgroundToCanvas(ctx, page, settings);
  drawPageTextToCanvas(ctx, page, settings);

  ctx.restore();
  return { canvas, scale };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/png" | "image/jpeg",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error("Browser failed to encode the rendered page image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function exportSinglePagePng(
  page: PaginatedPage,
  settings: PaperStudioSettings,
  baseFilename: string,
  preferredScale = 2.5
): Promise<PngExportResult> {
  const fontCheck = await ensureHandwritingFontLoaded(settings.fontId);
  if (!fontCheck.loaded) {
    throw new Error(
      fontCheck.error || "Selected handwriting font is not loaded yet."
    );
  }

  const { canvas } = await renderPageToCanvas(page, settings, preferredScale);
  try {
    const widthPx = canvas.width;
    const heightPx = canvas.height;
    const blob = await canvasToBlob(canvas, "image/png");
    const stem = sanitizeExportFilename(baseFilename);
    return {
      blob,
      filename: `${stem}-page-${page.pageNumber}.png`,
      widthPx,
      heightPx,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function exportAllPagesAsZipPng(
  doc: PaginatedDocument,
  settings: PaperStudioSettings,
  baseFilename: string,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<ZipPngExportResult> {
  const totalPages = doc.pages.length;
  if (totalPages === 0) {
    throw new Error("There are no pages to export.");
  }

  onProgress?.({
    stage: "loading-fonts",
    currentPage: 0,
    totalPages,
    detail: "Verifying handwriting font availability...",
  });

  const fontCheck = await ensureHandwritingFontLoaded(settings.fontId);
  if (!fontCheck.loaded) {
    throw new Error(
      fontCheck.error || "Selected handwriting font failed to load."
    );
  }

  const zip = new JSZip();
  const stem = sanitizeExportFilename(baseFilename);
  const padWidth = String(totalPages).length;

  for (let i = 0; i < totalPages; i += 1) {
    if (signal?.aborted) {
      throw new Error("Export cancelled.");
    }

    const page = doc.pages[i];
    onProgress?.({
      stage: "rendering",
      currentPage: i + 1,
      totalPages,
      detail: `Rendering page ${i + 1} of ${totalPages} as PNG...`,
    });

    const { canvas } = await renderPageToCanvas(page, settings, 2.5);
    try {
      const blob = await canvasToBlob(canvas, "image/png");
      const pageNum = String(page.pageNumber).padStart(padWidth, "0");
      zip.file(`${stem}-page-${pageNum}.png`, blob);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }

    await yieldToEventLoop();
  }

  if (signal?.aborted) {
    throw new Error("Export cancelled.");
  }

  onProgress?.({
    stage: "packaging",
    currentPage: totalPages,
    totalPages,
    detail: "Creating PNG archive...",
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return {
    blob: zipBlob,
    filename: `${stem}-pages.zip`,
    pageCount: totalPages,
  };
}

export async function exportDocumentToPdf(
  doc: PaginatedDocument,
  settings: PaperStudioSettings,
  baseFilename: string,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<PdfExportResult> {
  const totalPages = doc.pages.length;
  if (totalPages === 0) {
    throw new Error("There are no pages to export.");
  }

  onProgress?.({
    stage: "loading-fonts",
    currentPage: 0,
    totalPages,
    detail: "Verifying handwriting font availability...",
  });

  const fontCheck = await ensureHandwritingFontLoaded(settings.fontId);
  if (!fontCheck.loaded) {
    throw new Error(
      fontCheck.error ||
        "Selected handwriting font is not available. Export aborted to prevent fallback text."
    );
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(sanitizeExportFilename(baseFilename));
  pdfDoc.setCreator("BinRo Paper Studio");
  pdfDoc.setProducer("BinRo Paper Studio");

  // Keep long multi-page PDF exports balanced for memory & file size
  const preferredScale = totalPages > 16 ? 2.0 : 2.5;

  for (let i = 0; i < totalPages; i += 1) {
    if (signal?.aborted) {
      throw new Error("Export cancelled.");
    }

    const page = doc.pages[i];
    onProgress?.({
      stage: "rendering",
      currentPage: i + 1,
      totalPages,
      detail: `Rendering page ${i + 1} of ${totalPages}...`,
    });

    const { canvas } = await renderPageToCanvas(page, settings, preferredScale);
    let imageBytes: Uint8Array;
    try {
      const blob = await canvasToBlob(canvas, "image/png");
      imageBytes = new Uint8Array(await blob.arrayBuffer());
      if (imageBytes.length < 32) {
        throw new Error(`Rendered image for page ${page.pageNumber} is empty.`);
      }
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }

    onProgress?.({
      stage: "building-pdf",
      currentPage: i + 1,
      totalPages,
      detail: `Adding page ${i + 1} of ${totalPages} to PDF...`,
    });

    const embeddedPng = await pdfDoc.embedPng(imageBytes);
    const pdfPage = pdfDoc.addPage([page.widthPt, page.heightPt]);
    pdfPage.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: page.widthPt,
      height: page.heightPt,
    });

    await yieldToEventLoop();
  }

  if (signal?.aborted) {
    throw new Error("Export cancelled.");
  }

  onProgress?.({
    stage: "verifying",
    currentPage: totalPages,
    totalPages,
    detail: "Finalizing and verifying PDF...",
  });
  await yieldToEventLoop();

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
  });

  if (!validatePdfHeader(pdfBytes)) {
    throw new Error("Generated PDF failed header validation.");
  }

  const verified = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const verifiedCount = verified.getPageCount();
  if (verifiedCount !== totalPages) {
    throw new Error(
      `PDF page verification failed: expected ${totalPages}, got ${verifiedCount}.`
    );
  }

  return {
    bytes: pdfBytes,
    pageCount: verifiedCount,
    filename: `${sanitizeExportFilename(baseFilename)}.pdf`,
  };
}

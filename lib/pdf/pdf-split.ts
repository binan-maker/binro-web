import JSZip from "jszip";
import { EncryptedPDFError, PDFDict, PDFDocument, PDFName, PDFNumber } from "pdf-lib";

export const MAX_SPLIT_PDF_BYTES = 150 * 1024 * 1024; // 150 MB browser safeguard
export const MAX_SPLIT_RANGES = 100;
export const MAX_EVERY_PAGE_OUTPUTS = 300;

export type SplitMode = "ranges" | "extract" | "every-page";

export interface PdfSplitInspection {
  pageCount: number;
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  hasLinks: boolean;
  hasOutlines: boolean;
}

export interface SplitOutputPlan {
  id: string;
  filename: string;
  pages: number[]; // 1-based page numbers in exact output order
  rangeLabel: string;
}

export interface SplitOutputFile {
  id: string;
  filename: string;
  pages: number[];
  pageCount: number;
  rangeLabel: string;
  sizeBytes: number;
  bytes: Uint8Array;
}

export interface SplitProgress {
  stage: "reading" | "splitting" | "packaging" | "verifying";
  percent: number | null;
  detail: string;
}

export interface SplitPdfResult {
  outputs: SplitOutputFile[];
  zipBytes: Uint8Array | null;
  zipFilename: string | null;
  sourcePageCount: number;
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  hasLinks: boolean;
  hasOutlines: boolean;
}

export function formatPdfBytes(bytes: number): string {
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

export function cleanPdfStem(originalName: string): string {
  const withoutExt = originalName.replace(/\.pdf$/i, "").trim();
  const cleanStem = withoutExt
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleanStem || "document";
}

export function padPageNumber(page: number, totalPages: number): string {
  const width = Math.max(2, String(Math.max(1, totalPages)).length);
  return String(page).padStart(width, "0");
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

export function validateSplitFileMetadata(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > MAX_SPLIT_PDF_BYTES) {
    const maxMb = Math.round(MAX_SPLIT_PDF_BYTES / (1024 * 1024));
    return `This file exceeds the ${maxMb} MB browser-local processing limit.`;
  }
  const hasPdfMime =
    file.type === "application/pdf" || file.type === "application/x-pdf";
  const hasPdfExt = /\.pdf$/i.test(file.name);
  if (!hasPdfMime && !hasPdfExt) {
    return "Unsupported file type. Please select a valid PDF document (.pdf).";
  }
  return null;
}

export function translateSplitPdfError(error: unknown): string {
  if (error instanceof EncryptedPDFError) {
    return "This PDF is password-protected or encrypted. Remove the password before splitting.";
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("cancelled")) {
      return "Split cancelled.";
    }
    if (
      msg.includes("encrypt") ||
      msg.includes("password") ||
      msg.includes("decrypt")
    ) {
      return "This PDF is password-protected or encrypted. Remove the password before splitting.";
    }
    if (
      msg.includes("pdf header") ||
      msg.includes("failed to parse") ||
      msg.includes("no pdf header") ||
      msg.includes("invalid pdf") ||
      msg.includes("expected") ||
      msg.includes("unable to parse") ||
      msg.includes("unexpected eof") ||
      msg.includes("cannot read propert") ||
      msg.includes("xref") ||
      msg.includes("trailer") ||
      msg.includes("catalog")
    ) {
      return "Could not read this file. It may be corrupted or not a valid PDF.";
    }
    if (msg.includes("memory") || msg.includes("allocation")) {
      return "This document requires more memory than the browser can allocate.";
    }
    if (
      error.name !== "TypeError" &&
      error.name !== "RangeError" &&
      error.message.trim().length > 0 &&
      error.message.length < 220
    ) {
      return error.message;
    }
  }
  return "Unable to process this PDF. Please check that the file is a valid, unencrypted PDF.";
}

/**
 * Parse a single range or comma-separated page list (e.g., "1-5", "1, 3, 5-8, 12").
 * Preserves order, validates bounds, and rejects malformed, negative, zero, reversed,
 * duplicate, or oversized inputs.
 */
export function parsePageSelectionExpression(
  rawInput: string,
  totalPages: number
): { ok: true; pages: number[] } | { ok: false; error: string } {
  if (rawInput.length > 2000) {
    return {
      ok: false,
      error: "Page input is too long. Enter compact page ranges such as 1-10.",
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Enter at least one page number or range (for example: 1-5).",
    };
  }

  if (/[^0-9,\-\s]/.test(trimmed)) {
    return {
      ok: false,
      error:
        "Invalid characters found. Use only page numbers, hyphens (-), and commas (,).",
    };
  }

  const segments = trimmed.split(",");
  if (segments.length > 500) {
    return {
      ok: false,
      error: "Too many comma-separated entries. Use ranges such as 1-50.",
    };
  }

  const result: number[] = [];
  const seen = new Set<number>();

  for (const rawSeg of segments) {
    const seg = rawSeg.trim();
    if (!seg) {
      return {
        ok: false,
        error: "Incomplete page list near comma. Remove leading, trailing, or extra commas.",
      };
    }

    if (seg.includes("-")) {
      const parts = seg.split("-");
      if (parts.length !== 2) {
        if (seg.startsWith("-")) {
          return {
            ok: false,
            error: "Page numbers must be 1 or greater (negative numbers are not valid).",
          };
        }
        return {
          ok: false,
          error: `Invalid range "${seg}". Enter ranges with one hyphen, such as 1-5.`,
        };
      }

      const startStr = parts[0].trim();
      const endStr = parts[1].trim();
      if (!startStr) {
        return {
          ok: false,
          error:
            "Page numbers must be 1 or greater (negative or incomplete ranges are not valid).",
        };
      }
      if (!endStr) {
        return {
          ok: false,
          error: `Incomplete range "${seg}". Enter both a start and end page, such as 1-5.`,
        };
      }
      if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) {
        return {
          ok: false,
          error: `Invalid range "${seg}". Enter valid whole page numbers.`,
        };
      }

      const start = Number(startStr);
      const end = Number(endStr);

      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        return {
          ok: false,
          error: `Page numbers in "${seg}" are too large.`,
        };
      }
      if (start < 1 || end < 1) {
        return {
          ok: false,
          error: "Page numbers must be 1 or greater (page 0 is not valid).",
        };
      }
      if (start > end) {
        return {
          ok: false,
          error: `Invalid range ${start}-${end}: start page cannot be greater than end page.`,
        };
      }
      if (end > totalPages) {
        return {
          ok: false,
          error: `Page ${end} is out of range. This document has ${totalPages} ${totalPages === 1 ? "page" : "pages"}.`,
        };
      }

      for (let p = start; p <= end; p += 1) {
        if (seen.has(p)) {
          return {
            ok: false,
            error: `Page ${p} is referenced more than once. Remove duplicate page numbers.`,
          };
        }
        seen.add(p);
        result.push(p);
      }
    } else {
      if (!/^\d+$/.test(seg)) {
        return {
          ok: false,
          error: `Invalid page number "${seg}". Separate page numbers with commas.`,
        };
      }
      const pageNum = Number(seg);
      if (!Number.isSafeInteger(pageNum)) {
        return {
          ok: false,
          error: `Page number "${seg}" is too large.`,
        };
      }
      if (pageNum < 1) {
        return {
          ok: false,
          error: "Page numbers must be 1 or greater (page 0 is not valid).",
        };
      }
      if (pageNum > totalPages) {
        return {
          ok: false,
          error: `Page ${pageNum} is out of range. This document has ${totalPages} ${totalPages === 1 ? "page" : "pages"}.`,
        };
      }
      if (seen.has(pageNum)) {
        return {
          ok: false,
          error: `Page ${pageNum} is referenced more than once. Remove duplicate page numbers.`,
        };
      }
      seen.add(pageNum);
      result.push(pageNum);
    }
  }

  return { ok: true, pages: result };
}

function isContiguousAscending(pages: number[]): boolean {
  if (pages.length === 0) return false;
  for (let i = 1; i < pages.length; i += 1) {
    if (pages[i] !== pages[i - 1] + 1) return false;
  }
  return true;
}

export function buildSplitByRangesPlan(
  rangeInputs: string[],
  totalPages: number,
  sourceFilename: string
):
  | {
      ok: true;
      plans: SplitOutputPlan[];
      coveredPageCount: number;
      uncoveredPageCount: number;
    }
  | { ok: false; error: string; rangeIndex?: number } {
  if (rangeInputs.length === 0) {
    return { ok: false, error: "Add at least one page range to split." };
  }
  if (rangeInputs.length > MAX_SPLIT_RANGES) {
    return {
      ok: false,
      error: `You can define up to ${MAX_SPLIT_RANGES} ranges in a single split.`,
    };
  }

  const stem = cleanPdfStem(sourceFilename);
  const pageOwner = new Map<number, number>();
  const usedFilenames = new Set<string>();
  const plans: SplitOutputPlan[] = [];

  for (let idx = 0; idx < rangeInputs.length; idx += 1) {
    const raw = rangeInputs[idx];
    const parsed = parsePageSelectionExpression(raw, totalPages);
    if ("error" in parsed) {
      return {
        ok: false,
        error: `Range ${idx + 1}: ${parsed.error}`,
        rangeIndex: idx,
      };
    }

    const overlapsByOwner = new Map<number, number[]>();
    for (const page of parsed.pages) {
      const existingOwner = pageOwner.get(page);
      if (existingOwner !== undefined) {
        const arr = overlapsByOwner.get(existingOwner) ?? [];
        arr.push(page);
        overlapsByOwner.set(existingOwner, arr);
      }
    }

    if (overlapsByOwner.size > 0) {
      const [ownerIdx, overlapPages] = Array.from(overlapsByOwner.entries())[0];
      const previewPages =
        overlapPages.length > 4
          ? `${overlapPages.slice(0, 4).join(", ")}...`
          : overlapPages.join(", ");
      return {
        ok: false,
        error: `Range ${idx + 1} (${raw.trim()}) overlaps with Range ${ownerIdx + 1} on ${overlapPages.length === 1 ? "page" : "pages"} ${previewPages}.`,
        rangeIndex: idx,
      };
    }

    for (const page of parsed.pages) {
      pageOwner.set(page, idx);
    }

    let baseFilename: string;
    if (isContiguousAscending(parsed.pages)) {
      const start = parsed.pages[0];
      const end = parsed.pages[parsed.pages.length - 1];
      baseFilename =
        start === end
          ? `${stem}-${padPageNumber(start, totalPages)}.pdf`
          : `${stem}-${padPageNumber(start, totalPages)}-${padPageNumber(end, totalPages)}.pdf`;
    } else {
      baseFilename = `${stem}-part-${padPageNumber(idx + 1, rangeInputs.length)}.pdf`;
    }

    let finalFilename = baseFilename;
    let suffix = 2;
    while (usedFilenames.has(finalFilename)) {
      finalFilename = baseFilename.replace(/\.pdf$/i, `-${suffix}.pdf`);
      suffix += 1;
    }
    usedFilenames.add(finalFilename);

    plans.push({
      id: `range-${idx + 1}`,
      filename: finalFilename,
      pages: parsed.pages,
      rangeLabel:
        parsed.pages.length === 1
          ? `Page ${parsed.pages[0]}`
          : isContiguousAscending(parsed.pages)
            ? `Pages ${parsed.pages[0]}–${parsed.pages[parsed.pages.length - 1]}`
            : `${parsed.pages.length} selected pages`,
    });
  }

  return {
    ok: true,
    plans,
    coveredPageCount: pageOwner.size,
    uncoveredPageCount: Math.max(0, totalPages - pageOwner.size),
  };
}

export function buildExtractPagesPlan(
  expression: string,
  totalPages: number,
  sourceFilename: string
): { ok: true; plan: SplitOutputPlan } | { ok: false; error: string } {
  const parsed = parsePageSelectionExpression(expression, totalPages);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const stem = cleanPdfStem(sourceFilename);
  return {
    ok: true,
    plan: {
      id: "extracted-pages",
      filename: `${stem}-extracted.pdf`,
      pages: parsed.pages,
      rangeLabel:
        parsed.pages.length === 1
          ? `Page ${parsed.pages[0]}`
          : `${parsed.pages.length} pages (${expression.trim()})`,
    },
  };
}

export function buildEveryPageSplitPlan(
  totalPages: number,
  sourceFilename: string
): { ok: true; plans: SplitOutputPlan[] } | { ok: false; error: string } {
  if (totalPages < 1) {
    return { ok: false, error: "This PDF has no readable pages to split." };
  }
  if (totalPages > MAX_EVERY_PAGE_OUTPUTS) {
    return {
      ok: false,
      error: `Split every page supports up to ${MAX_EVERY_PAGE_OUTPUTS} pages in browser memory. Use Split by page ranges to split larger documents into sections.`,
    };
  }

  const stem = cleanPdfStem(sourceFilename);
  const plans: SplitOutputPlan[] = [];
  for (let p = 1; p <= totalPages; p += 1) {
    plans.push({
      id: `page-${p}`,
      filename: `${stem}-${padPageNumber(p, totalPages)}.pdf`,
      pages: [p],
      rangeLabel: `Page ${p}`,
    });
  }

  return { ok: true, plans };
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Split cancelled.");
  }
}

function detectDocumentCapabilities(pdfDoc: PDFDocument): {
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  hasLinks: boolean;
  hasOutlines: boolean;
} {
  let hasDigitalSignature = false;
  let hasFormFields = false;
  let hasLinks = false;
  const hasOutlines = Boolean(pdfDoc.catalog.lookup(PDFName.of("Outlines")));

  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (acroForm instanceof PDFDict) {
    const fields = acroForm.lookup(PDFName.of("Fields"));
    if (fields && "size" in fields && typeof fields.size === "function") {
      if ((fields as { size: () => number }).size() > 0) {
        hasFormFields = true;
      }
    }
    const sigFlags = acroForm.lookup(PDFName.of("SigFlags"));
    if (sigFlags instanceof PDFNumber && sigFlags.asNumber() > 0) {
      hasDigitalSignature = true;
    }
  }

  for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFDict) {
      const type = obj.lookup(PDFName.of("Type"));
      const ft = obj.lookup(PDFName.of("FT"));
      const subtype = obj.lookup(PDFName.of("Subtype"));
      if (
        type === PDFName.of("Sig") ||
        ft === PDFName.of("Sig") ||
        Boolean(obj.lookup(PDFName.of("ByteRange")))
      ) {
        hasDigitalSignature = true;
      }
      if (subtype === PDFName.of("Widget")) {
        hasFormFields = true;
      }
      if (subtype === PDFName.of("Link")) {
        hasLinks = true;
      }
    }
  }

  return { hasDigitalSignature, hasFormFields, hasLinks, hasOutlines };
}

export async function inspectPdfForSplit(
  bytes: Uint8Array
): Promise<PdfSplitInspection> {
  if (bytes.length === 0) {
    throw new Error("The selected file is empty.");
  }
  if (!validatePdfHeader(bytes)) {
    throw new Error(
      "Could not find a valid PDF header. Please select an uncorrupted PDF document."
    );
  }

  const pdfDoc = await PDFDocument.load(bytes, {
    updateMetadata: false,
  });
  const pageCount = pdfDoc.getPageCount();
  if (pageCount < 1) {
    throw new Error("This PDF contains no readable pages.");
  }

  const caps = detectDocumentCapabilities(pdfDoc);
  return {
    pageCount,
    ...caps,
  };
}

export async function splitPdfBytes(
  sourceBytes: Uint8Array,
  plans: SplitOutputPlan[],
  sourceFilename: string,
  onProgress?: (progress: SplitProgress) => void,
  signal?: AbortSignal
): Promise<SplitPdfResult> {
  checkAborted(signal);

  if (plans.length === 0) {
    throw new Error("Specify at least one page range or page selection.");
  }

  onProgress?.({
    stage: "reading",
    percent: null,
    detail: "Reading source PDF",
  });
  await yieldToEventLoop();
  checkAborted(signal);

  if (!validatePdfHeader(sourceBytes)) {
    throw new Error(
      "Could not find a valid PDF header. Please select an uncorrupted PDF document."
    );
  }

  const sourceDoc = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
  });
  const sourcePageCount = sourceDoc.getPageCount();
  if (sourcePageCount < 1) {
    throw new Error("This PDF contains no readable pages.");
  }

  for (const plan of plans) {
    for (const p of plan.pages) {
      if (p < 1 || p > sourcePageCount) {
        throw new Error(
          `Page ${p} is out of range. This document has ${sourcePageCount} pages.`
        );
      }
    }
  }

  const caps = detectDocumentCapabilities(sourceDoc);
  const outputs: SplitOutputFile[] = [];

  for (let i = 0; i < plans.length; i += 1) {
    checkAborted(signal);
    const plan = plans[i];

    onProgress?.({
      stage: "splitting",
      percent: Math.round((i / plans.length) * 100),
      detail: `Creating file ${i + 1} of ${plans.length}`,
    });

    const outDoc = await PDFDocument.create();
    outDoc.setCreator("BinRo PDF Splitter");
    outDoc.setProducer("BinRo PDF Splitter");

    const zeroBasedIndices = plan.pages.map((p) => p - 1);
    const copiedPages = await outDoc.copyPages(sourceDoc, zeroBasedIndices);
    for (const page of copiedPages) {
      outDoc.addPage(page);
    }

    const outBytes = await outDoc.save({
      useObjectStreams: true,
      updateFieldAppearances: false,
    });

    checkAborted(signal);

    if (!validatePdfHeader(outBytes)) {
      throw new Error(
        `Generated output "${plan.filename}" failed PDF header validation.`
      );
    }

    const verifiedDoc = await PDFDocument.load(outBytes, {
      updateMetadata: false,
    });
    if (verifiedDoc.getPageCount() !== plan.pages.length) {
      throw new Error(
        `Output verification failed for "${plan.filename}": expected ${plan.pages.length} pages.`
      );
    }

    outputs.push({
      id: plan.id,
      filename: plan.filename,
      pages: plan.pages,
      pageCount: plan.pages.length,
      rangeLabel: plan.rangeLabel,
      sizeBytes: outBytes.length,
      bytes: outBytes,
    });

    onProgress?.({
      stage: "splitting",
      percent: Math.round(((i + 1) / plans.length) * 100),
      detail: `Created file ${i + 1} of ${plans.length}`,
    });

    if (i % 4 === 3 || plans.length <= 20) {
      await yieldToEventLoop();
    }
  }

  checkAborted(signal);

  let zipBytes: Uint8Array | null = null;
  let zipFilename: string | null = null;

  if (outputs.length > 1) {
    onProgress?.({
      stage: "packaging",
      percent: null,
      detail: `Packaging ${outputs.length} files into ZIP`,
    });
    await yieldToEventLoop();
    checkAborted(signal);

    const zip = new JSZip();
    for (const file of outputs) {
      zip.file(file.filename, file.bytes);
    }
    zipBytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    if (!zipBytes || zipBytes.length <= 22) {
      throw new Error("Generated ZIP archive appears invalid or empty.");
    }

    zipFilename = `${cleanPdfStem(sourceFilename)}-split.zip`;
  }

  onProgress?.({
    stage: "verifying",
    percent: null,
    detail: "Finalising validated downloads",
  });

  return {
    outputs,
    zipBytes,
    zipFilename,
    sourcePageCount,
    ...caps,
  };
}

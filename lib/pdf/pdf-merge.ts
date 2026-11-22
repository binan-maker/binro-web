import { EncryptedPDFError, PDFDict, PDFDocument, PDFName, PDFNumber } from "pdf-lib";

export const MAX_MERGE_FILES = 30;
export const MAX_SINGLE_PDF_BYTES = 100 * 1024 * 1024; // 100 MB per PDF
export const MAX_TOTAL_MERGE_BYTES = 200 * 1024 * 1024; // 200 MB combined batch

export interface PdfMergeInspection {
  pageCount: number;
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  fingerprint: string;
}

export interface MergeProgress {
  stage: "merging" | "generating" | "verifying";
  percent: number | null;
  detail: string;
}

export interface MergeSourceInput {
  id: string;
  name: string;
  bytes: Uint8Array | (() => Promise<Uint8Array>);
}

export interface MergePdfResult {
  mergedBytes: Uint8Array;
  fileCount: number;
  totalPages: number;
  outputSizeBytes: number;
  hasAnyDigitalSignature: boolean;
  hasAnyFormFields: boolean;
}

export class MergeSourceError extends Error {
  sourceId: string;
  sourceName: string;

  constructor(sourceId: string, sourceName: string, message: string) {
    super(message);
    this.name = "MergeSourceError";
    this.sourceId = sourceId;
    this.sourceName = sourceName;
  }
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

export function sanitizeMergedPdfFilename(rawName: string): string {
  const trimmed = rawName.trim().replace(/\.pdf$/i, "");
  const safeStem = trimmed
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safeStem || "binro-merged"}.pdf`;
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

export function validateMergeFileMetadata(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return `"${file.name}" is empty and cannot be merged.`;
  }
  if (file.size > MAX_SINGLE_PDF_BYTES) {
    const maxMb = Math.round(MAX_SINGLE_PDF_BYTES / (1024 * 1024));
    return `"${file.name}" exceeds the ${maxMb} MB per-file limit for reliable browser merging.`;
  }
  const hasPdfMime =
    file.type === "application/pdf" || file.type === "application/x-pdf";
  const hasPdfExt = /\.pdf$/i.test(file.name);
  if (!hasPdfMime && !hasPdfExt) {
    return `"${file.name}" is not a PDF file. Only valid .pdf documents are supported.`;
  }
  return null;
}

export function translateMergePdfError(
  error: unknown,
  filename?: string
): string {
  const prefix = filename ? `"${filename}": ` : "";

  if (error instanceof EncryptedPDFError) {
    return `${prefix}This PDF is password-protected or encrypted. Remove the password before merging.`;
  }

  if (error instanceof Error) {
    if (error.name === "MergeSourceError") {
      return error.message;
    }
    const msg = error.message.toLowerCase();
    if (msg.includes("cancelled")) {
      return "Merge cancelled.";
    }
    if (
      msg.includes("encrypt") ||
      msg.includes("password") ||
      msg.includes("decrypt")
    ) {
      return `${prefix}This PDF is password-protected or encrypted. Remove the password before merging.`;
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
      return `${prefix}Could not read this file. It may be corrupted or not a valid PDF.`;
    }
    if (msg.includes("memory") || msg.includes("allocation")) {
      return `${prefix}This document requires more memory than the browser can allocate.`;
    }
    if (
      error.name !== "TypeError" &&
      error.name !== "RangeError" &&
      error.message.trim().length > 0 &&
      error.message.length < 220
    ) {
      return filename && !error.message.includes(filename)
        ? `${prefix}${error.message}`
        : error.message;
    }
  }

  return `${prefix}Unable to process this PDF. Please check that it is a valid, unencrypted PDF.`;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Merge cancelled.");
  }
}

export async function computeBytesFingerprint(
  bytes: Uint8Array
): Promise<string> {
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof crypto.subtle.digest === "function"
  ) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const digest = await crypto.subtle.digest("SHA-256", copy);
    const arr = Array.from(new Uint8Array(digest));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Deterministic non-crypto fallback fingerprint when WebCrypto subtle is unavailable
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let i = 0; i < bytes.length; i += step) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= bytes[bytes.length - 1 - i];
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${bytes.length}:${(h1 >>> 0).toString(16)}:${(h2 >>> 0).toString(16)}`;
}

function detectSignaturesAndForms(pdfDoc: PDFDocument): {
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
} {
  let hasDigitalSignature = false;
  let hasFormFields = false;

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
    }
  }

  return { hasDigitalSignature, hasFormFields };
}

export async function inspectPdfForMerge(
  bytes: Uint8Array,
  filename?: string
): Promise<PdfMergeInspection> {
  if (bytes.length === 0) {
    throw new Error(
      filename
        ? `"${filename}" is empty and cannot be merged.`
        : "The selected PDF file is empty."
    );
  }
  if (!validatePdfHeader(bytes)) {
    throw new Error(
      filename
        ? `"${filename}" does not appear to be a valid PDF file (missing PDF header).`
        : "Could not find a valid PDF header. Please select an uncorrupted PDF document."
    );
  }

  const pdfDoc = await PDFDocument.load(bytes, {
    updateMetadata: false,
  });

  const pageCount = pdfDoc.getPageCount();
  if (pageCount < 1) {
    throw new Error(
      filename
        ? `"${filename}" contains no readable pages.`
        : "This PDF contains no readable pages."
    );
  }

  const { hasDigitalSignature, hasFormFields } =
    detectSignaturesAndForms(pdfDoc);
  const fingerprint = await computeBytesFingerprint(bytes);

  return {
    pageCount,
    hasDigitalSignature,
    hasFormFields,
    fingerprint,
  };
}

export async function mergePdfSources(
  sources: MergeSourceInput[],
  onProgress?: (progress: MergeProgress) => void,
  signal?: AbortSignal
): Promise<MergePdfResult> {
  checkAborted(signal);

  if (sources.length < 2) {
    throw new Error("Select at least two valid PDF files to merge.");
  }

  const mergedPdf = await PDFDocument.create();
  mergedPdf.setCreator("BinRo PDF Merger");
  mergedPdf.setProducer("BinRo PDF Merger");

  let expectedTotalPages = 0;
  let hasAnyDigitalSignature = false;
  let hasAnyFormFields = false;

  for (let i = 0; i < sources.length; i += 1) {
    checkAborted(signal);
    const source = sources[i];

    onProgress?.({
      stage: "merging",
      percent: Math.round((i / sources.length) * 100),
      detail: `Adding file ${i + 1} of ${sources.length}`,
    });
    await yieldToEventLoop();
    checkAborted(signal);

    let rawBytes: Uint8Array;
    try {
      rawBytes =
        typeof source.bytes === "function"
          ? await source.bytes()
          : source.bytes;
    } catch (err) {
      throw new MergeSourceError(
        source.id,
        source.name,
        translateMergePdfError(err, source.name)
      );
    }

    if (!validatePdfHeader(rawBytes)) {
      throw new MergeSourceError(
        source.id,
        source.name,
        `"${source.name}": Missing valid PDF header. Please remove or replace this file.`
      );
    }

    let sourceDoc: PDFDocument;
    let pageCount = 0;
    let flags: { hasDigitalSignature: boolean; hasFormFields: boolean };
    try {
      sourceDoc = await PDFDocument.load(rawBytes, {
        updateMetadata: false,
      });
      pageCount = sourceDoc.getPageCount();
      flags = detectSignaturesAndForms(sourceDoc);
    } catch (err) {
      throw new MergeSourceError(
        source.id,
        source.name,
        translateMergePdfError(err, source.name)
      );
    }

    if (pageCount < 1) {
      throw new MergeSourceError(
        source.id,
        source.name,
        `"${source.name}": Contains no readable pages.`
      );
    }

    if (flags.hasDigitalSignature) hasAnyDigitalSignature = true;
    if (flags.hasFormFields) hasAnyFormFields = true;

    try {
      const copiedPages = await mergedPdf.copyPages(
        sourceDoc,
        sourceDoc.getPageIndices()
      );
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
      expectedTotalPages += copiedPages.length;
    } catch (err) {
      throw new MergeSourceError(
        source.id,
        source.name,
        translateMergePdfError(err, source.name)
      );
    }

    onProgress?.({
      stage: "merging",
      percent: Math.round(((i + 1) / sources.length) * 100),
      detail: `Added file ${i + 1} of ${sources.length}`,
    });
    await yieldToEventLoop();
  }

  checkAborted(signal);

  onProgress?.({
    stage: "generating",
    percent: null,
    detail: "Generating merged PDF",
  });
  await yieldToEventLoop();
  checkAborted(signal);

  const mergedBytes = await mergedPdf.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
  });

  checkAborted(signal);

  onProgress?.({
    stage: "verifying",
    percent: null,
    detail: "Verifying merged PDF",
  });
  await yieldToEventLoop();
  checkAborted(signal);

  if (!validatePdfHeader(mergedBytes)) {
    throw new Error("Merged output failed PDF header validation.");
  }

  const verifiedDoc = await PDFDocument.load(mergedBytes, {
    updateMetadata: false,
  });
  const verifiedPages = verifiedDoc.getPageCount();
  if (verifiedPages !== expectedTotalPages) {
    throw new Error(
      `Output verification failed: expected ${expectedTotalPages} pages but generated ${verifiedPages}.`
    );
  }

  return {
    mergedBytes,
    fileCount: sources.length,
    totalPages: verifiedPages,
    outputSizeBytes: mergedBytes.length,
    hasAnyDigitalSignature,
    hasAnyFormFields,
  };
}

import {
  EncryptedPDFError,
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  decodePDFRawStream,
} from "pdf-lib";

export const MAX_PDF_INPUT_BYTES = 150 * 1024 * 1024; // 150 MB browser safeguard

export type CompressionMode = "recommended" | "target";

export interface PdfInspectionResult {
  pageCount: number;
  imageCount: number;
  optimizableImageCount: number;
  hasDigitalSignature: boolean;
  hasLinks: boolean;
  isEncrypted: boolean;
}

export interface CompressPdfOptions {
  mode: CompressionMode;
  targetSizeBytes: number | null;
  stripMetadataAndThumbs: boolean;
  preserveImageResolution: boolean;
}

export interface CompressionProgress {
  stage:
    | "reading"
    | "analyzing"
    | "compressing-images"
    | "optimizing-structure"
    | "verifying";
  percent: number;
  detail: string;
}

export interface CompressPdfOutput {
  compressedBytes: Uint8Array | null;
  originalSizeBytes: number;
  outputSizeBytes: number;
  bytesSaved: number;
  percentReduction: number;
  pageCount: number;
  imagesProcessed: number;
  imagesOptimized: number;
  targetSizeBytes: number | null;
  targetMet: boolean;
  alreadyOptimized: boolean;
  hasDigitalSignature: boolean;
  note: string | null;
}

export type ImageReencoder = (input: {
  kind: "jpeg" | "rgba";
  bytes: Uint8Array;
  width: number;
  height: number;
  maxEdge: number | null;
  quality: number;
}) => Promise<{ jpegBytes: Uint8Array; width: number; height: number } | null>;

interface CompressionPass {
  maxImageEdge: number | null;
  jpegQuality: number;
}

const RECOMMENDED_PASS: CompressionPass = {
  maxImageEdge: 1650,
  jpegQuality: 0.8,
};

const TARGET_PASSES: CompressionPass[] = [
  { maxImageEdge: 1850, jpegQuality: 0.84 },
  { maxImageEdge: 1500, jpegQuality: 0.72 },
  { maxImageEdge: 1250, jpegQuality: 0.6 },
  { maxImageEdge: 1050, jpegQuality: 0.48 },
  { maxImageEdge: 880, jpegQuality: 0.38 },
];

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

export function buildCompressedPdfFilename(originalName: string): string {
  const withoutExt = originalName.replace(/\.pdf$/i, "").trim();
  const cleanStem =
    withoutExt
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "binro-document";
  return `${cleanStem}-compressed.pdf`;
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

export function validatePdfFileMetadata(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > MAX_PDF_INPUT_BYTES) {
    return `This file exceeds the ${Math.round(MAX_PDF_INPUT_BYTES / (1024 * 1024))} MB limit for reliable browser-local processing.`;
  }
  const hasPdfMime =
    file.type === "application/pdf" || file.type === "application/x-pdf";
  const hasPdfExt = /\.pdf$/i.test(file.name);
  if (!hasPdfMime && !hasPdfExt) {
    return "Unsupported file type. Please choose a valid PDF document (.pdf).";
  }
  return null;
}

export function translatePdfError(error: unknown): string {
  if (error instanceof EncryptedPDFError) {
    return "This PDF is password-protected or encrypted. Remove the password before compressing.";
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("encrypt") ||
      msg.includes("password") ||
      msg.includes("decrypt")
    ) {
      return "This PDF is password-protected or encrypted. Remove the password before compressing.";
    }
    if (
      msg.includes("pdf header") ||
      msg.includes("failed to parse") ||
      msg.includes("no pdf header") ||
      msg.includes("invalid pdf") ||
      msg.includes("expected") ||
      msg.includes("unable to parse") ||
      msg.includes("unexpected eof")
    ) {
      return "Could not read this file. It may be corrupted or not a valid PDF.";
    }
    if (msg.includes("memory") || msg.includes("allocation")) {
      return "This document requires more memory than the browser can allocate.";
    }
    if (error.message.trim().length > 0 && error.message.length < 180) {
      return error.message;
    }
  }
  return "Unable to process this PDF. Please check that the file is a valid, unencrypted PDF.";
}

async function deflateZlib(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") {
    return null;
  }
  try {
    const cs = new CompressionStream("deflate");
    const writer = cs.writable.getWriter();
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    await writer.write(copy);
    await writer.close();

    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
      }
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  } catch {
    return null;
  }
}

function unfilterPngPredictor(
  encoded: Uint8Array,
  width: number,
  height: number,
  components: number
): Uint8Array | null {
  const rowBytes = width * components;
  const stride = rowBytes + 1;
  if (encoded.length < stride * height) {
    return null;
  }

  const out = new Uint8Array(rowBytes * height);

  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };

  for (let row = 0; row < height; row += 1) {
    const filterType = encoded[row * stride];
    const srcStart = row * stride + 1;
    const dstStart = row * rowBytes;
    const prevRowStart = (row - 1) * rowBytes;

    for (let x = 0; x < rowBytes; x += 1) {
      const raw = encoded[srcStart + x];
      const left = x >= components ? out[dstStart + x - components] : 0;
      const up = row > 0 ? out[prevRowStart + x] : 0;
      const upLeft =
        row > 0 && x >= components
          ? out[prevRowStart + x - components]
          : 0;

      let recon: number;
      switch (filterType) {
        case 0:
          recon = raw;
          break;
        case 1:
          recon = (raw + left) & 0xff;
          break;
        case 2:
          recon = (raw + up) & 0xff;
          break;
        case 3:
          recon = (raw + ((left + up) >> 1)) & 0xff;
          break;
        case 4:
          recon = (raw + paeth(left, up, upLeft)) & 0xff;
          break;
        default:
          return null;
      }
      out[dstStart + x] = recon;
    }
  }

  return out;
}

function resolveColorSpaceComponents(
  pdfDoc: PDFDocument,
  rawColorSpace: unknown
): {
  kind: "rgb" | "gray" | "indexed-rgb";
  components: number;
  palette?: Uint8Array;
  hival?: number;
} | null {
  const cs =
    rawColorSpace instanceof PDFRef
      ? pdfDoc.context.lookup(rawColorSpace)
      : rawColorSpace;

  if (cs instanceof PDFName) {
    if (cs === PDFName.of("DeviceRGB")) {
      return { kind: "rgb", components: 3 };
    }
    if (cs === PDFName.of("DeviceGray")) {
      return { kind: "gray", components: 1 };
    }
    return null;
  }

  if (cs instanceof PDFArray && cs.size() >= 2) {
    const csType = cs.lookup(0);
    if (csType === PDFName.of("ICCBased")) {
      const profile = cs.lookup(1);
      if (profile instanceof PDFRawStream) {
        const nObj = profile.dict.lookup(PDFName.of("N"));
        if (nObj instanceof PDFNumber) {
          const n = nObj.asNumber();
          if (n === 3) return { kind: "rgb", components: 3 };
          if (n === 1) return { kind: "gray", components: 1 };
        }
      }
      return null;
    }

    if (csType === PDFName.of("CalRGB")) {
      return { kind: "rgb", components: 3 };
    }
    if (csType === PDFName.of("CalGray")) {
      return { kind: "gray", components: 1 };
    }

    if (csType === PDFName.of("Indexed") && cs.size() >= 4) {
      const baseCs = resolveColorSpaceComponents(pdfDoc, cs.get(1));
      const hivalObj = cs.lookup(2);
      const lookupObj = cs.lookup(3);
      if (
        baseCs &&
        baseCs.kind === "rgb" &&
        hivalObj instanceof PDFNumber &&
        lookupObj
      ) {
        let palette: Uint8Array | null = null;
        if (lookupObj instanceof PDFRawStream) {
          try {
            palette = decodePDFRawStream(lookupObj).decode();
          } catch {
            palette = null;
          }
        } else if ("asBytes" in lookupObj && typeof lookupObj.asBytes === "function") {
          palette = (lookupObj as { asBytes: () => Uint8Array }).asBytes();
        }
        if (palette) {
          return {
            kind: "indexed-rgb",
            components: 1,
            palette,
            hival: hivalObj.asNumber(),
          };
        }
      }
    }
  }

  return null;
}

function getSingleFilterName(dict: PDFDict): PDFName | null {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (!filter) return null;
  if (filter instanceof PDFName) return filter;
  if (filter instanceof PDFArray && filter.size() === 1) {
    const first = filter.lookup(0);
    if (first instanceof PDFName) return first;
  }
  return PDFName.of("__MULTI__");
}

function isImageEligible(
  pdfDoc: PDFDocument,
  dict: PDFDict
): {
  eligible: boolean;
  width: number;
  height: number;
  filter: "dct" | "flate" | "raw";
  colorInfo: NonNullable<ReturnType<typeof resolveColorSpaceComponents>>;
  hasSMask: boolean;
  predictor: number;
} | null {
  const subtype = dict.lookup(PDFName.of("Subtype"));
  if (subtype !== PDFName.of("Image")) return null;

  const imageMask = dict.lookup(PDFName.of("ImageMask"));
  if (imageMask instanceof PDFBool && imageMask.asBoolean()) return null;
  if (dict.lookup(PDFName.of("Mask"))) return null;
  if (dict.lookup(PDFName.of("Decode"))) return null;

  const widthObj = dict.lookup(PDFName.of("Width"));
  const heightObj = dict.lookup(PDFName.of("Height"));
  if (!(widthObj instanceof PDFNumber) || !(heightObj instanceof PDFNumber)) {
    return null;
  }
  const width = widthObj.asNumber();
  const height = heightObj.asNumber();
  if (width < 48 && height < 48) return null;
  if (width * height > 25_000_000) return null; // Protect browser canvas memory

  const bpcObj = dict.lookup(PDFName.of("BitsPerComponent"));
  const bpc = bpcObj instanceof PDFNumber ? bpcObj.asNumber() : 8;
  if (bpc !== 8) return null;

  const colorInfo = resolveColorSpaceComponents(
    pdfDoc,
    dict.get(PDFName.of("ColorSpace"))
  );
  if (!colorInfo) return null;

  const filter = getSingleFilterName(dict);
  let filterKind: "dct" | "flate" | "raw";
  if (filter === null) {
    filterKind = "raw";
  } else if (filter === PDFName.of("DCTDecode")) {
    filterKind = "dct";
  } else if (filter === PDFName.of("FlateDecode")) {
    filterKind = "flate";
  } else {
    return null;
  }

  let predictor = 1;
  const decodeParms = dict.lookup(PDFName.of("DecodeParms"));
  if (decodeParms instanceof PDFDict) {
    const predObj = decodeParms.lookup(PDFName.of("Predictor"));
    if (predObj instanceof PDFNumber) {
      predictor = predObj.asNumber();
    }
    const colorsObj = decodeParms.lookup(PDFName.of("Colors"));
    if (
      colorsObj instanceof PDFNumber &&
      colorsObj.asNumber() !== colorInfo.components
    ) {
      return null;
    }
  } else if (decodeParms instanceof PDFArray) {
    const first = decodeParms.lookup(0);
    if (first instanceof PDFDict) {
      const predObj = first.lookup(PDFName.of("Predictor"));
      if (predObj instanceof PDFNumber) {
        predictor = predObj.asNumber();
      }
    }
  }

  if (predictor > 1 && (predictor < 10 || predictor > 15)) {
    return null;
  }

  const hasSMask = Boolean(dict.lookup(PDFName.of("SMask")));

  return {
    eligible: true,
    width,
    height,
    filter: filterKind,
    colorInfo,
    hasSMask,
    predictor,
  };
}

function buildRgbaPixels(
  rawPixels: Uint8Array,
  width: number,
  height: number,
  colorInfo: NonNullable<ReturnType<typeof resolveColorSpaceComponents>>
): Uint8Array | null {
  const pixelCount = width * height;
  if (colorInfo.kind === "rgb") {
    if (rawPixels.length < pixelCount * 3) return null;
    const rgba = new Uint8Array(pixelCount * 4);
    for (let i = 0, p = 0; i < pixelCount; i += 1, p += 3) {
      const q = i * 4;
      rgba[q] = rawPixels[p];
      rgba[q + 1] = rawPixels[p + 1];
      rgba[q + 2] = rawPixels[p + 2];
      rgba[q + 3] = 255;
    }
    return rgba;
  }

  if (colorInfo.kind === "gray") {
    if (rawPixels.length < pixelCount) return null;
    const rgba = new Uint8Array(pixelCount * 4);
    for (let i = 0; i < pixelCount; i += 1) {
      const g = rawPixels[i];
      const q = i * 4;
      rgba[q] = g;
      rgba[q + 1] = g;
      rgba[q + 2] = g;
      rgba[q + 3] = 255;
    }
    return rgba;
  }

  if (colorInfo.kind === "indexed-rgb" && colorInfo.palette) {
    if (rawPixels.length < pixelCount) return null;
    const palette = colorInfo.palette;
    const maxIndex = Math.min(
      colorInfo.hival ?? 255,
      Math.floor(palette.length / 3) - 1
    );
    const rgba = new Uint8Array(pixelCount * 4);
    for (let i = 0; i < pixelCount; i += 1) {
      const idx = Math.min(rawPixels[i], maxIndex) * 3;
      const q = i * 4;
      rgba[q] = palette[idx];
      rgba[q + 1] = palette[idx + 1];
      rgba[q + 2] = palette[idx + 2];
      rgba[q + 3] = 255;
    }
    return rgba;
  }

  return null;
}

function detectDocumentSignaturesAndLinks(pdfDoc: PDFDocument): {
  hasDigitalSignature: boolean;
  hasLinks: boolean;
} {
  let hasDigitalSignature = false;
  let hasLinks = false;

  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (acroForm instanceof PDFDict) {
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
      if (subtype === PDFName.of("Link")) {
        hasLinks = true;
      }
    }
  }

  return { hasDigitalSignature, hasLinks };
}

export async function inspectPdfBytes(
  bytes: Uint8Array
): Promise<PdfInspectionResult> {
  if (bytes.length === 0) {
    throw new Error("The selected PDF file is empty.");
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

  let imageCount = 0;
  let optimizableImageCount = 0;

  for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream) {
      const subtype = obj.dict.lookup(PDFName.of("Subtype"));
      if (subtype === PDFName.of("Image")) {
        imageCount += 1;
        if (isImageEligible(pdfDoc, obj.dict)) {
          optimizableImageCount += 1;
        }
      }
    }
  }

  const { hasDigitalSignature, hasLinks } =
    detectDocumentSignaturesAndLinks(pdfDoc);

  return {
    pageCount,
    imageCount,
    optimizableImageCount,
    hasDigitalSignature,
    hasLinks,
    isEncrypted: false,
  };
}

async function runSingleCompressionPass(
  sourceBytes: Uint8Array,
  pass: CompressionPass,
  options: CompressPdfOptions,
  reencodeImage: ImageReencoder,
  onProgress?: (progress: CompressionProgress) => void
): Promise<{
  bytes: Uint8Array;
  pageCount: number;
  imagesProcessed: number;
  imagesOptimized: number;
  hasDigitalSignature: boolean;
}> {
  const pdfDoc = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
  });

  const pageCount = pdfDoc.getPageCount();
  const { hasDigitalSignature } = detectDocumentSignaturesAndLinks(pdfDoc);

  if (options.stripMetadataAndThumbs) {
    // Remove per-page embedded thumbnail previews (/Thumb)
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      page.node.delete(PDFName.of("Thumb"));
    }
    // Remove heavy optional XMP metadata stream if present on catalog
    pdfDoc.catalog.delete(PDFName.of("Metadata"));
  }

  const imageEntries: Array<{
    ref: PDFRef;
    stream: PDFRawStream;
    meta: NonNullable<ReturnType<typeof isImageEligible>>;
  }> = [];

  const nonImageRawStreams: Array<{
    ref: PDFRef;
    stream: PDFRawStream;
  }> = [];

  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.lookup(PDFName.of("Subtype"));
    if (subtype === PDFName.of("Image")) {
      const meta = isImageEligible(pdfDoc, obj.dict);
      if (meta) {
        imageEntries.push({ ref, stream: obj, meta });
      }
    } else if (
      !obj.dict.lookup(PDFName.of("Filter")) &&
      obj.contents.length > 160
    ) {
      nonImageRawStreams.push({ ref, stream: obj });
    }
  }

  let imagesOptimized = 0;
  for (let i = 0; i < imageEntries.length; i += 1) {
    const entry = imageEntries[i];
    if (onProgress) {
      const pct = Math.min(
        82,
        20 + Math.round(((i + 1) / Math.max(1, imageEntries.length)) * 60)
      );
      onProgress({
        stage: "compressing-images",
        percent: pct,
        detail: `Optimising embedded image ${i + 1} of ${imageEntries.length}`,
      });
    }

    const { ref, stream, meta } = entry;
    const origLen = stream.contents.length;
    const maxEdge =
      meta.hasSMask || options.preserveImageResolution
        ? null
        : pass.maxImageEdge;

    let reencoded: { jpegBytes: Uint8Array; width: number; height: number } | null =
      null;

    if (meta.filter === "dct") {
      reencoded = await reencodeImage({
        kind: "jpeg",
        bytes: stream.contents,
        width: meta.width,
        height: meta.height,
        maxEdge,
        quality: pass.jpegQuality,
      });
    } else {
      let decodedPixels: Uint8Array | null = null;
      try {
        decodedPixels =
          meta.filter === "flate"
            ? decodePDFRawStream(stream).decode()
            : stream.contents;
      } catch {
        decodedPixels = null;
      }

      if (decodedPixels && meta.predictor >= 10) {
        decodedPixels = unfilterPngPredictor(
          decodedPixels,
          meta.width,
          meta.height,
          meta.colorInfo.components
        );
      }

      if (decodedPixels) {
        const rgba = buildRgbaPixels(
          decodedPixels,
          meta.width,
          meta.height,
          meta.colorInfo
        );
        if (rgba) {
          reencoded = await reencodeImage({
            kind: "rgba",
            bytes: rgba,
            width: meta.width,
            height: meta.height,
            maxEdge,
            quality: pass.jpegQuality,
          });
        }
      }
    }

    // Replace only when genuinely smaller (at least 4% saved) so already-tight JPEGs stay crisp
    if (reencoded && reencoded.jpegBytes.length < origLen * 0.96) {
      const newDict = stream.dict.clone(pdfDoc.context);
      newDict.set(PDFName.of("Width"), PDFNumber.of(reencoded.width));
      newDict.set(PDFName.of("Height"), PDFNumber.of(reencoded.height));
      newDict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
      newDict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
      newDict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
      newDict.set(
        PDFName.of("Length"),
        PDFNumber.of(reencoded.jpegBytes.length)
      );
      newDict.delete(PDFName.of("DecodeParms"));
      newDict.delete(PDFName.of("Decode"));

      const newStream = PDFRawStream.of(newDict, reencoded.jpegBytes);
      pdfDoc.context.assign(ref, newStream);
      imagesOptimized += 1;
    }
  }

  onProgress?.({
    stage: "optimizing-structure",
    percent: 88,
    detail: "Compacting document streams and cross-references",
  });

  // Losslessly Flate-compress uncompressed content/font/data streams
  for (const { ref, stream } of nonImageRawStreams) {
    const deflated = await deflateZlib(stream.contents);
    if (deflated && deflated.length < stream.contents.length * 0.95) {
      const newDict = stream.dict.clone(pdfDoc.context);
      newDict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
      newDict.set(PDFName.of("Length"), PDFNumber.of(deflated.length));
      pdfDoc.context.assign(ref, PDFRawStream.of(newDict, deflated));
    }
  }

  const savedBytes = await pdfDoc.save({
    useObjectStreams: true,
    updateFieldAppearances: false,
  });

  return {
    bytes: savedBytes,
    pageCount,
    imagesProcessed: imageEntries.length,
    imagesOptimized,
    hasDigitalSignature,
  };
}

export async function compressPdfBytes(
  sourceBytes: Uint8Array,
  options: CompressPdfOptions,
  reencodeImage: ImageReencoder,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressPdfOutput> {
  const originalSizeBytes = sourceBytes.length;

  onProgress?.({
    stage: "reading",
    percent: 8,
    detail: "Reading PDF structure",
  });

  const inspection = await inspectPdfBytes(sourceBytes);

  onProgress?.({
    stage: "analyzing",
    percent: 16,
    detail:
      inspection.optimizableImageCount > 0
        ? `Found ${inspection.pageCount} ${inspection.pageCount === 1 ? "page" : "pages"} and ${inspection.optimizableImageCount} optimizable ${inspection.optimizableImageCount === 1 ? "image" : "images"}`
        : `Found ${inspection.pageCount} ${inspection.pageCount === 1 ? "page" : "pages"} (structure optimization)`,
  });

  const targetBytes =
    options.mode === "target" &&
    options.targetSizeBytes !== null &&
    options.targetSizeBytes > 0
      ? options.targetSizeBytes
      : null;

  let bestPassResult: Awaited<ReturnType<typeof runSingleCompressionPass>> | null =
    null;

  if (targetBytes === null) {
    bestPassResult = await runSingleCompressionPass(
      sourceBytes,
      RECOMMENDED_PASS,
      options,
      reencodeImage,
      onProgress
    );
  } else {
    const passes =
      inspection.optimizableImageCount > 0
        ? TARGET_PASSES
        : [TARGET_PASSES[0]];

    for (let idx = 0; idx < passes.length; idx += 1) {
      const pass = passes[idx];
      const result = await runSingleCompressionPass(
        sourceBytes,
        pass,
        options,
        reencodeImage,
        (inner) => {
          if (!onProgress) return;
          const base = Math.round((idx / passes.length) * 70) + 15;
          const span = Math.round(70 / passes.length);
          const scaled = Math.min(
            88,
            base + Math.round((inner.percent / 100) * span)
          );
          onProgress({
            stage: inner.stage,
            percent: scaled,
            detail:
              passes.length > 1
                ? `Pass ${idx + 1}/${passes.length}: ${inner.detail}`
                : inner.detail,
          });
        }
      );

      if (!bestPassResult || result.bytes.length < bestPassResult.bytes.length) {
        bestPassResult = result;
      }

      if (result.bytes.length <= targetBytes) {
        bestPassResult = result;
        break;
      }
    }
  }

  if (!bestPassResult) {
    throw new Error("Unable to produce an optimised PDF output.");
  }

  onProgress?.({
    stage: "verifying",
    percent: 95,
    detail: "Verifying compressed PDF integrity",
  });

  // Validate generated PDF integrity and page count
  const verifiedDoc = await PDFDocument.load(bestPassResult.bytes, {
    updateMetadata: false,
  });
  if (verifiedDoc.getPageCount() !== inspection.pageCount) {
    throw new Error(
      "Output validation failed: page count changed unexpectedly. Original file preserved."
    );
  }

  const outputSizeBytes = bestPassResult.bytes.length;
  const bytesSaved = originalSizeBytes - outputSizeBytes;

  if (bytesSaved <= 0) {
    return {
      compressedBytes: null,
      originalSizeBytes,
      outputSizeBytes: originalSizeBytes,
      bytesSaved: 0,
      percentReduction: 0,
      pageCount: inspection.pageCount,
      imagesProcessed: bestPassResult.imagesProcessed,
      imagesOptimized: bestPassResult.imagesOptimized,
      targetSizeBytes: targetBytes,
      targetMet: targetBytes !== null ? originalSizeBytes <= targetBytes : false,
      alreadyOptimized: true,
      hasDigitalSignature: inspection.hasDigitalSignature,
      note: "This PDF is already optimised. Saving a rewritten copy did not reduce its size, so your original file was kept.",
    };
  }

  const percentReduction = Math.max(
    1,
    Math.round((bytesSaved / originalSizeBytes) * 100)
  );
  const targetMet =
    targetBytes === null ? true : outputSizeBytes <= targetBytes;

  let note: string | null = null;
  if (targetBytes !== null && !targetMet) {
    note =
      inspection.optimizableImageCount === 0
        ? `Could not reach ${formatPdfBytes(targetBytes)} because this PDF contains mostly text, fonts, or vector graphics rather than compressible images. Here is the smallest valid version (${formatPdfBytes(outputSizeBytes)}).`
        : `Could not safely reach ${formatPdfBytes(targetBytes)} while keeping the document readable. Here is the smallest readable version (${formatPdfBytes(outputSizeBytes)}).`;
  }

  onProgress?.({
    stage: "verifying",
    percent: 100,
    detail: "Done",
  });

  return {
    compressedBytes: bestPassResult.bytes,
    originalSizeBytes,
    outputSizeBytes,
    bytesSaved,
    percentReduction,
    pageCount: inspection.pageCount,
    imagesProcessed: bestPassResult.imagesProcessed,
    imagesOptimized: bestPassResult.imagesOptimized,
    targetSizeBytes: targetBytes,
    targetMet,
    alreadyOptimized: false,
    hasDigitalSignature: inspection.hasDigitalSignature,
    note,
  };
}

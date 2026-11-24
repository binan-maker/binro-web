import {
  MM_TO_CSS_PX,
  PT_TO_CSS_PX,
  getPageDimensions,
  normalizeStudioSettings,
  type HandwritingFontId,
  type PaperStudioSettings,
  type TextAlignOption,
} from "./config";
import {
  parseDocumentText,
  type DocumentBlock,
  type DocumentBlockType,
  type InlineRun,
} from "./document";
import { getHandwritingFont } from "./fonts";
import {
  getLineVariation,
  getWordVariation,
  type LineVariation,
} from "./variation";

export interface TextMeasurer {
  measureWidth: (
    text: string,
    fontFamily: string,
    fontSizePx: number,
    fontWeight: number,
    italic: boolean
  ) => number;
  getAscentRatio?: (
    fontFamily: string,
    fontSizePx: number,
    fontWeight: number
  ) => number;
}

export interface RenderedSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  widthPx: number;
  offsetX: number;
}

export interface RenderedWord {
  segments: RenderedSegment[];
  widthPx: number;
  x: number;
  baselineShiftPx: number;
}

export interface RenderedLine {
  lineIndex: number;
  blockType: DocumentBlockType;
  x: number;
  y: number;
  baselineOffsetPx: number;
  widthPx: number;
  lineHeightPx: number;
  fontSizePx: number;
  baseFontWeight: number;
  boldFontWeight: number;
  listMarker?: string;
  listMarkerX?: number;
  listMarkerWidthPx?: number;
  align: TextAlignOption;
  variation: LineVariation;
  words: RenderedWord[];
}

export interface PaginatedPage {
  pageIndex: number;
  pageNumber: number;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  widthPt: number;
  heightPt: number;
  contentRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  lines: RenderedLine[];
}

export interface PaginatedDocument {
  pages: PaginatedPage[];
  totalLines: number;
  estimatedPages: number;
  fontId: HandwritingFontId;
}

interface TokenWord {
  segments: Omit<RenderedSegment, "offsetX">[];
  widthPx: number;
  trailingSpaceWidthPx: number;
}

/**
 * Browser Canvas 2D measurer with per-pass string width memoization
 * so long documents paginate rapidly without repeated layout thrashing.
 */
export function createCanvasTextMeasurer(): TextMeasurer {
  const widthCache = new Map<string, number>();
  const ascentCache = new Map<string, number>();

  let ctx: CanvasRenderingContext2D | null = null;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
  }

  return {
    measureWidth(text, fontFamily, fontSizePx, fontWeight, italic) {
      if (!text) return 0;
      const roundedSize = Math.round(fontSizePx * 100) / 100;
      const cacheKey = `${fontFamily}|${fontWeight}|${italic ? 1 : 0}|${roundedSize}|${text}`;
      const cached = widthCache.get(cacheKey);
      if (cached !== undefined) return cached;

      let width: number;
      if (ctx) {
        ctx.font = `${italic ? "italic " : ""}${fontWeight} ${roundedSize}px "${fontFamily}", cursive`;
        width = ctx.measureText(text).width;
      } else {
        // Deterministic fallback for headless/Node unit tests
        const avgGlyphFactor = fontWeight >= 600 ? 0.52 : 0.48;
        width = text.length * roundedSize * avgGlyphFactor;
      }

      if (widthCache.size < 25000) {
        widthCache.set(cacheKey, width);
      }
      return width;
    },
    getAscentRatio(fontFamily, fontSizePx, fontWeight) {
      const key = `${fontFamily}|${fontWeight}|${Math.round(fontSizePx)}`;
      const cached = ascentCache.get(key);
      if (cached !== undefined) return cached;

      let ratio = 0.78;
      if (ctx) {
        ctx.font = `${fontWeight} ${fontSizePx}px "${fontFamily}", cursive`;
        const metrics = ctx.measureText("Ágjpqy");
        if (
          typeof metrics.fontBoundingBoxAscent === "number" &&
          typeof metrics.fontBoundingBoxDescent === "number" &&
          metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent > 0
        ) {
          ratio =
            metrics.fontBoundingBoxAscent /
            (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent);
        } else if (typeof metrics.actualBoundingBoxAscent === "number") {
          ratio = Math.min(0.88, Math.max(0.68, metrics.actualBoundingBoxAscent / fontSizePx));
        }
      }
      ascentCache.set(key, ratio);
      return ratio;
    },
  };
}

function getBlockTypography(
  blockType: DocumentBlockType,
  baseFontSizePx: number,
  lineSpacing: number,
  baseWeight: number,
  boldWeight: number
): {
  fontSizePx: number;
  lineHeightPx: number;
  defaultWeight: number;
  topSpacingPx: number;
  bottomSpacingPx: number;
} {
  const baseLineHeight = baseFontSizePx * lineSpacing;

  if (blockType === "h1") {
    const fontSizePx = baseFontSizePx * 1.4;
    const lineHeightPx = fontSizePx * Math.max(1.25, lineSpacing * 0.92);
    return {
      fontSizePx,
      lineHeightPx,
      defaultWeight: boldWeight,
      topSpacingPx: baseLineHeight * 0.35,
      bottomSpacingPx: baseLineHeight * 0.25,
    };
  }

  if (blockType === "h2") {
    const fontSizePx = baseFontSizePx * 1.18;
    const lineHeightPx = fontSizePx * Math.max(1.25, lineSpacing * 0.95);
    return {
      fontSizePx,
      lineHeightPx,
      defaultWeight: boldWeight,
      topSpacingPx: baseLineHeight * 0.25,
      bottomSpacingPx: baseLineHeight * 0.15,
    };
  }

  return {
    fontSizePx: baseFontSizePx,
    lineHeightPx: baseLineHeight,
    defaultWeight: baseWeight,
    topSpacingPx: 0,
    bottomSpacingPx: 0,
  };
}

function tokenizeRunsToWords(
  runs: InlineRun[],
  fontFamily: string,
  fontSizePx: number,
  baseWeight: number,
  boldWeight: number,
  wordSpacingPx: number,
  measurer: TextMeasurer
): TokenWord[] {
  const words: TokenWord[] = [];
  let currentSegments: Omit<RenderedSegment, "offsetX">[] = [];
  let currentWidth = 0;

  const normalSpaceWidth =
    measurer.measureWidth(" ", fontFamily, fontSizePx, baseWeight, false) +
    wordSpacingPx;

  const pushCurrentWord = (trailingSpaceWidth: number) => {
    if (currentSegments.length === 0) return;
    words.push({
      segments: currentSegments,
      widthPx: currentWidth,
      trailingSpaceWidthPx: Math.max(2, trailingSpaceWidth),
    });
    currentSegments = [];
    currentWidth = 0;
  };

  for (const run of runs) {
    const weight = run.bold ? boldWeight : baseWeight;
    // Split keeping whitespace groups intact
    const pieces = run.text.split(/(\s+)/);
    for (const piece of pieces) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        const spaceCount = Math.max(1, piece.length);
        const spaceWidth = Math.max(2, normalSpaceWidth) * spaceCount;
        if (currentSegments.length > 0) {
          pushCurrentWord(spaceWidth);
        } else {
          // Leading indentation before the first word on a line
          currentSegments.push({
            text: piece,
            bold: run.bold,
            italic: run.italic,
            underline: false,
            widthPx: spaceWidth,
          });
          currentWidth += spaceWidth;
        }
      } else {
        const segWidth = measurer.measureWidth(
          piece,
          fontFamily,
          fontSizePx,
          weight,
          run.italic
        );
        currentSegments.push({
          text: piece,
          bold: run.bold,
          italic: run.italic,
          underline: run.underline,
          widthPx: segWidth,
        });
        currentWidth += segWidth;
      }
    }
  }

  pushCurrentWord(0);
  return words;
}

function splitOversizedWord(
  word: TokenWord,
  maxWidth: number,
  fontFamily: string,
  fontSizePx: number,
  baseWeight: number,
  boldWeight: number,
  measurer: TextMeasurer
): TokenWord[] {
  if (word.widthPx <= maxWidth || maxWidth <= 20) {
    return [word];
  }

  const out: TokenWord[] = [];
  let segAcc: Omit<RenderedSegment, "offsetX">[] = [];
  let accWidth = 0;

  for (const seg of word.segments) {
    const weight = seg.bold ? boldWeight : baseWeight;
    let charBuf = "";
    let charBufWidth = 0;

    for (const ch of seg.text) {
      const chWidth = measurer.measureWidth(
        ch,
        fontFamily,
        fontSizePx,
        weight,
        seg.italic
      );

      if (accWidth + charBufWidth + chWidth > maxWidth && (accWidth > 0 || charBuf.length > 0)) {
        if (charBuf.length > 0) {
          segAcc.push({
            text: charBuf,
            bold: seg.bold,
            italic: seg.italic,
            underline: seg.underline,
            widthPx: charBufWidth,
          });
        }
        out.push({
          segments: segAcc,
          widthPx: accWidth + charBufWidth,
          trailingSpaceWidthPx: 0,
        });
        segAcc = [];
        accWidth = 0;
        charBuf = ch;
        charBufWidth = chWidth;
      } else {
        charBuf += ch;
        charBufWidth += chWidth;
      }
    }

    if (charBuf.length > 0) {
      segAcc.push({
        text: charBuf,
        bold: seg.bold,
        italic: seg.italic,
        underline: seg.underline,
        widthPx: charBufWidth,
      });
      accWidth += charBufWidth;
    }
  }

  if (segAcc.length > 0) {
    out.push({
      segments: segAcc,
      widthPx: accWidth,
      trailingSpaceWidthPx: word.trailingSpaceWidthPx,
    });
  }

  return out;
}

interface WrappedLineDraft {
  words: TokenWord[];
  isLastLineOfBlock: boolean;
  isContinuationLine: boolean;
}

function wrapBlockWords(
  rawWords: TokenWord[],
  firstLineMaxWidth: number,
  continuationMaxWidth: number,
  fontFamily: string,
  fontSizePx: number,
  baseWeight: number,
  boldWeight: number,
  measurer: TextMeasurer
): WrappedLineDraft[] {
  if (rawWords.length === 0) {
    return [];
  }

  // Expand any unbreakable token that exceeds the available width
  const words: TokenWord[] = [];
  const safeMax = Math.max(24, Math.min(firstLineMaxWidth, continuationMaxWidth));
  for (const w of rawWords) {
    if (w.widthPx > safeMax) {
      words.push(
        ...splitOversizedWord(
          w,
          safeMax,
          fontFamily,
          fontSizePx,
          baseWeight,
          boldWeight,
          measurer
        )
      );
    } else {
      words.push(w);
    }
  }

  const lines: WrappedLineDraft[] = [];
  let lineWords: TokenWord[] = [];
  let lineWidth = 0;
  let isFirstLine = true;

  // Small 1.5px wrap tolerance prevents subpixel DOM/Canvas differences from re-wrapping
  const wrapTolerancePx = 1.5;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const maxLineW = isFirstLine ? firstLineMaxWidth : continuationMaxWidth;
    const prevSpace =
      lineWords.length > 0 ? lineWords[lineWords.length - 1].trailingSpaceWidthPx : 0;

    if (
      lineWords.length > 0 &&
      lineWidth + prevSpace + word.widthPx + wrapTolerancePx > maxLineW
    ) {
      lines.push({
        words: lineWords,
        isLastLineOfBlock: false,
        isContinuationLine: !isFirstLine,
      });
      lineWords = [word];
      lineWidth = word.widthPx;
      isFirstLine = false;
    } else {
      lineWords.push(word);
      lineWidth += prevSpace + word.widthPx;
    }
  }

  if (lineWords.length > 0) {
    lines.push({
      words: lineWords,
      isLastLineOfBlock: true,
      isContinuationLine: !isFirstLine,
    });
  }

  return lines;
}

function layoutLineWords(
  draft: WrappedLineDraft,
  lineStartX: number,
  lineMaxWidth: number,
  align: TextAlignOption,
  variationLevel: PaperStudioSettings["variationLevel"],
  variationSeed: number,
  pageIndex: number,
  lineIndex: number,
  lineVariation: LineVariation
): { words: RenderedWord[]; totalWidthPx: number } {
  const tokens = draft.words;
  if (tokens.length === 0) {
    return { words: [], totalWidthPx: 0 };
  }

  const baseGaps: number[] = [];
  let rawTotalWidth = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    rawTotalWidth += tokens[i].widthPx;
    if (i < tokens.length - 1) {
      const wVar = getWordVariation(
        variationLevel,
        variationSeed,
        pageIndex,
        lineIndex,
        i
      );
      // Keep minimum gap >= 2px so words never collide or overlap
      const baseGap = tokens[i].trailingSpaceWidthPx;
      const adjustedGap = Math.max(2, baseGap + wVar.spacingDeltaPx);
      baseGaps.push(adjustedGap);
      rawTotalWidth += adjustedGap;
    }
  }

  // Clamp total width safely inside lineMaxWidth
  if (rawTotalWidth > lineMaxWidth && baseGaps.length > 0) {
    const excess = rawTotalWidth - lineMaxWidth;
    const shrinkPerGap = excess / baseGaps.length;
    rawTotalWidth = 0;
    for (let i = 0; i < tokens.length; i += 1) {
      rawTotalWidth += tokens[i].widthPx;
      if (i < baseGaps.length) {
        baseGaps[i] = Math.max(2, baseGaps[i] - shrinkPerGap);
        rawTotalWidth += baseGaps[i];
      }
    }
  }

  // Alignment offset
  let startOffset = 0;
  if (align === "center") {
    startOffset = Math.max(0, (lineMaxWidth - rawTotalWidth) / 2);
  } else if (align === "right") {
    startOffset = Math.max(0, lineMaxWidth - rawTotalWidth);
  } else if (
    align === "justify" &&
    !draft.isLastLineOfBlock &&
    tokens.length > 1
  ) {
    const freeSpace = Math.max(0, lineMaxWidth - rawTotalWidth);
    const maxExtraPerGap = 14;
    const extraPerGap = Math.min(maxExtraPerGap, freeSpace / (tokens.length - 1));
    for (let i = 0; i < baseGaps.length; i += 1) {
      baseGaps[i] += extraPerGap;
    }
    rawTotalWidth += extraPerGap * baseGaps.length;
  } else if (align === "left") {
    const maxAllowedIndent = Math.max(0, lineMaxWidth - rawTotalWidth);
    startOffset = Math.min(
      maxAllowedIndent,
      Math.max(0, lineVariation.indentOffsetPx)
    );
  }

  let cursorX = lineStartX + startOffset;
  const renderedWords: RenderedWord[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    const wVar = getWordVariation(
      variationLevel,
      variationSeed,
      pageIndex,
      lineIndex,
      i
    );

    let segOffset = 0;
    const segments: RenderedSegment[] = tok.segments.map((seg) => {
      const rendered: RenderedSegment = {
        ...seg,
        offsetX: segOffset,
      };
      segOffset += seg.widthPx;
      return rendered;
    });

    renderedWords.push({
      segments,
      widthPx: tok.widthPx,
      x: Number(cursorX.toFixed(2)),
      baselineShiftPx: wVar.baselineShiftPx,
    });

    cursorX += tok.widthPx + (i < baseGaps.length ? baseGaps[i] : 0);
  }

  return {
    words: renderedWords,
    totalWidthPx: Number(rawTotalWidth.toFixed(2)),
  };
}

function hasRenderableContentAhead(
  blocks: DocumentBlock[],
  fromIndex: number
): boolean {
  for (let i = fromIndex; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.type === "page-break") continue;
    if (b.type === "blank") continue;
    if (b.runs.some((r) => r.text.length > 0)) return true;
  }
  return false;
}

export function paginateDocument(
  rawText: string,
  rawSettings: PaperStudioSettings,
  measurer: TextMeasurer
): PaginatedDocument {
  const settings = normalizeStudioSettings(rawSettings);
  const font = getHandwritingFont(settings.fontId);
  const dims = getPageDimensions(settings.paperFormat, settings.orientation);

  // Convert mm margins & offsets to CSS px while clamping strictly inside printable page
  const minEdgePx = 12;
  const rawLeft =
    settings.marginsMm.left * MM_TO_CSS_PX +
    settings.textOffsetXMm * MM_TO_CSS_PX;
  const rawRight =
    settings.marginsMm.right * MM_TO_CSS_PX -
    settings.textOffsetXMm * MM_TO_CSS_PX;
  const rawTop =
    settings.marginsMm.top * MM_TO_CSS_PX +
    settings.textOffsetYMm * MM_TO_CSS_PX;
  const rawBottom =
    settings.marginsMm.bottom * MM_TO_CSS_PX -
    settings.textOffsetYMm * MM_TO_CSS_PX;

  const contentLeft = Math.min(
    dims.widthPx - minEdgePx - 48,
    Math.max(minEdgePx, rawLeft)
  );
  const contentRight = Math.min(
    dims.widthPx - minEdgePx,
    Math.max(contentLeft + 48, dims.widthPx - Math.max(minEdgePx, rawRight))
  );
  const contentTop = Math.min(
    dims.heightPx - minEdgePx - 48,
    Math.max(minEdgePx, rawTop)
  );
  const contentBottom = Math.min(
    dims.heightPx - minEdgePx,
    Math.max(contentTop + 48, dims.heightPx - Math.max(minEdgePx, rawBottom))
  );

  const contentRect = {
    left: Number(contentLeft.toFixed(2)),
    top: Number(contentTop.toFixed(2)),
    width: Number((contentRight - contentLeft).toFixed(2)),
    height: Number((contentBottom - contentTop).toFixed(2)),
  };

  const baseFontSizePx = settings.fontSizePt * PT_TO_CSS_PX * font.fontSizeScale;
  const bodyLineHeightPx = baseFontSizePx * settings.lineSpacing;
  const baseWeight = settings.fontWeight;
  const ascentRatio =
    measurer.getAscentRatio?.(font.family, baseFontSizePx, baseWeight) ?? 0.78;

  const blocks = parseDocumentText(rawText);
  const pages: PaginatedPage[] = [];

  let currentLines: RenderedLine[] = [];
  let cursorY = contentRect.top;
  let globalLineCounter = 0;

  const pushPage = () => {
    const pageIndex = pages.length;
    pages.push({
      pageIndex,
      pageNumber: pageIndex + 1,
      widthPx: dims.widthPx,
      heightPx: dims.heightPx,
      widthMm: dims.widthMm,
      heightMm: dims.heightMm,
      widthPt: dims.widthPt,
      heightPt: dims.heightPt,
      contentRect,
      lines: currentLines,
    });
    currentLines = [];
    cursorY = contentRect.top;
  };

  for (let bIdx = 0; bIdx < blocks.length; bIdx += 1) {
    const block = blocks[bIdx];

    if (block.type === "page-break") {
      if (currentLines.length > 0 && hasRenderableContentAhead(blocks, bIdx + 1)) {
        pushPage();
      }
      continue;
    }

    if (block.type === "blank") {
      // Only add blank vertical space if we are not already at the top of a fresh page
      if (currentLines.length > 0) {
        if (cursorY + bodyLineHeightPx <= contentBottom) {
          cursorY += bodyLineHeightPx;
        } else if (hasRenderableContentAhead(blocks, bIdx + 1)) {
          pushPage();
        }
      }
      continue;
    }

    const typo = getBlockTypography(
      block.type,
      baseFontSizePx,
      settings.lineSpacing,
      baseWeight,
      font.boldWeight
    );

    if (currentLines.length > 0 && typo.topSpacingPx > 0) {
      if (cursorY + typo.topSpacingPx + typo.lineHeightPx <= contentBottom) {
        cursorY += typo.topSpacingPx;
      } else {
        pushPage();
      }
    }

    // List indentation
    let listMarkerWidthPx = 0;
    let listIndentPx = 0;
    if (block.type === "bullet" || block.type === "numbered") {
      const markerText = `${block.listMarker ?? "•"} `;
      listMarkerWidthPx = measurer.measureWidth(
        markerText,
        font.family,
        typo.fontSizePx,
        baseWeight,
        false
      );
      listIndentPx = Math.max(
        Math.round(typo.fontSizePx * 1.25),
        Math.ceil(listMarkerWidthPx + 4)
      );
    }

    const effectiveMaxWidth = Math.max(
      24,
      contentRect.width - listIndentPx
    );

    const words = tokenizeRunsToWords(
      block.runs,
      font.family,
      typo.fontSizePx,
      baseWeight,
      font.boldWeight,
      settings.wordSpacingPx,
      measurer
    );

    const wrappedLines = wrapBlockWords(
      words,
      effectiveMaxWidth,
      effectiveMaxWidth,
      font.family,
      typo.fontSizePx,
      baseWeight,
      font.boldWeight,
      measurer
    );

    const lineAlign: TextAlignOption =
      block.type === "h1" || block.type === "h2"
        ? settings.textAlign === "justify"
          ? "left"
          : settings.textAlign
        : settings.textAlign;

    const baselineOffsetPx = Number(
      (
        (typo.lineHeightPx - typo.fontSizePx) / 2 +
        typo.fontSizePx * ascentRatio
      ).toFixed(2)
    );

    for (let lIdx = 0; lIdx < wrappedLines.length; lIdx += 1) {
      const draft = wrappedLines[lIdx];

      if (cursorY + typo.lineHeightPx > contentBottom && currentLines.length > 0) {
        pushPage();
      }

      const pageIndex = pages.length;
      const lineVariation = getLineVariation(
        settings.variationLevel,
        settings.variationSeed,
        pageIndex,
        currentLines.length
      );

      // Clamp vertical baseline shift so lines never stray outside content bounds
      const maxUpShift = Math.max(0, cursorY - contentRect.top);
      const maxDownShift = Math.max(0, contentBottom - (cursorY + typo.lineHeightPx));
      const clampedBaselineShift = Math.min(
        maxDownShift,
        Math.max(-maxUpShift, lineVariation.baselineShiftPx)
      );
      const safeVariation: LineVariation = {
        ...lineVariation,
        baselineShiftPx: clampedBaselineShift,
      };

      const lineStartX = contentRect.left + listIndentPx;
      const positioned = layoutLineWords(
        draft,
        lineStartX,
        effectiveMaxWidth,
        lineAlign,
        settings.variationLevel,
        settings.variationSeed,
        pageIndex,
        currentLines.length,
        safeVariation
      );

      const showMarker =
        lIdx === 0 &&
        (block.type === "bullet" || block.type === "numbered") &&
        Boolean(block.listMarker);

      currentLines.push({
        lineIndex: globalLineCounter,
        blockType: block.type,
        x: Number(lineStartX.toFixed(2)),
        y: Number(cursorY.toFixed(2)),
        baselineOffsetPx,
        widthPx: positioned.totalWidthPx,
        lineHeightPx: Number(typo.lineHeightPx.toFixed(2)),
        fontSizePx: Number(typo.fontSizePx.toFixed(2)),
        baseFontWeight: baseWeight,
        boldFontWeight: font.boldWeight,
        listMarker: showMarker ? block.listMarker : undefined,
        listMarkerX: showMarker ? contentRect.left : undefined,
        listMarkerWidthPx: showMarker ? listMarkerWidthPx : undefined,
        align: lineAlign,
        variation: safeVariation,
        words: positioned.words,
      });

      globalLineCounter += 1;
      cursorY += typo.lineHeightPx;
    }

    // Bottom spacing after heading or paragraph
    const extraAfter =
      block.type === "h1" || block.type === "h2"
        ? typo.bottomSpacingPx
        : settings.paragraphSpacingPx;

    if (extraAfter > 0 && currentLines.length > 0) {
      cursorY += extraAfter;
    }
  }

  // Always return at least 1 page (e.g. empty document renders 1 clean sheet)
  if (currentLines.length > 0 || pages.length === 0) {
    pushPage();
  }

  return {
    pages,
    totalLines: globalLineCounter,
    estimatedPages: pages.length,
    fontId: settings.fontId,
  };
}

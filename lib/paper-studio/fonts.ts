import type { HandwritingFontId } from "./config";

export type FontLoadStatus = "idle" | "loading" | "ready" | "error";

export interface UnicodeRangeTuple {
  start: number;
  end: number;
}

export interface HandwritingFontDefinition {
  id: HandwritingFontId;
  name: string;
  family: string;
  fallbackFamily: string;
  cssFontFamily: string;
  availableWeights: number[];
  boldWeight: number;
  supportsTrueBold: boolean;
  supportsTrueItalic: boolean;
  supportedRangeLabel: string;
  supportedRanges: UnicodeRangeTuple[];
  previewSample: string;
  description: string;
  licenseName: string;
  licensePath: string;
  copyright: string;
  fontSizeScale: number;
}

const LATIN_BASIC_AND_PUNCTUATION: UnicodeRangeTuple[] = [
  { start: 0x0020, end: 0x00ff },
  { start: 0x0131, end: 0x0131 },
  { start: 0x0152, end: 0x0153 },
  { start: 0x02bb, end: 0x02bc },
  { start: 0x02c6, end: 0x02c6 },
  { start: 0x02da, end: 0x02da },
  { start: 0x02dc, end: 0x02dc },
  { start: 0x0304, end: 0x0304 },
  { start: 0x0308, end: 0x0308 },
  { start: 0x0329, end: 0x0329 },
  { start: 0x2000, end: 0x206f },
  { start: 0x20ac, end: 0x20ac },
  { start: 0x2122, end: 0x2122 },
  { start: 0x2191, end: 0x2191 },
  { start: 0x2193, end: 0x2193 },
  { start: 0x2212, end: 0x2212 },
  { start: 0x2215, end: 0x2215 },
];

const LATIN_EXTENDED: UnicodeRangeTuple[] = [
  { start: 0x0100, end: 0x02ba },
  { start: 0x02bd, end: 0x02c5 },
  { start: 0x02c7, end: 0x02cc },
  { start: 0x02ce, end: 0x02d7 },
  { start: 0x02dd, end: 0x02ff },
  { start: 0x1d00, end: 0x1dbf },
  { start: 0x1e00, end: 0x1e9f },
  { start: 0x1ef2, end: 0x1eff },
  { start: 0x2020, end: 0x2020 },
  { start: 0x20a0, end: 0x20ab },
  { start: 0x20ad, end: 0x20c0 },
  { start: 0x2113, end: 0x2113 },
  { start: 0x2c60, end: 0x2c7f },
  { start: 0xa720, end: 0xa7ff },
];

const CYRILLIC_RANGES: UnicodeRangeTuple[] = [
  { start: 0x0301, end: 0x0301 },
  { start: 0x0400, end: 0x045f },
  { start: 0x0460, end: 0x052f },
  { start: 0x1c80, end: 0x1c8a },
  { start: 0x20b4, end: 0x20b4 },
  { start: 0x2116, end: 0x2116 },
  { start: 0x2de0, end: 0x2dff },
  { start: 0xa640, end: 0xa69f },
  { start: 0xfe2e, end: 0xfe2f },
];

const DEVANAGARI_RANGES: UnicodeRangeTuple[] = [
  { start: 0x0900, end: 0x097f },
  { start: 0x1cd0, end: 0x1cf9 },
  { start: 0x200c, end: 0x200d },
  { start: 0x20a8, end: 0x20a8 },
  { start: 0x20b9, end: 0x20b9 }, // Indian Rupee symbol ₹
  { start: 0x20f0, end: 0x20f0 },
  { start: 0x25cc, end: 0x25cc },
  { start: 0xa830, end: 0xa839 },
  { start: 0xa8e0, end: 0xa8ff },
];

const VIETNAMESE_RANGES: UnicodeRangeTuple[] = [
  { start: 0x0102, end: 0x0103 },
  { start: 0x0110, end: 0x0111 },
  { start: 0x0128, end: 0x0129 },
  { start: 0x0168, end: 0x0169 },
  { start: 0x01a0, end: 0x01a1 },
  { start: 0x01af, end: 0x01b0 },
  { start: 0x0300, end: 0x0303 },
  { start: 0x0309, end: 0x0309 },
  { start: 0x0323, end: 0x0323 },
  { start: 0x1ea0, end: 0x1ef9 },
];

export const HANDWRITING_FONTS: HandwritingFontDefinition[] = [
  {
    id: "kalam",
    name: "Kalam",
    family: "Kalam",
    fallbackFamily: "cursive",
    cssFontFamily: '"Kalam", cursive',
    availableWeights: [300, 400, 700],
    boldWeight: 700,
    supportsTrueBold: true,
    supportsTrueItalic: false,
    supportedRangeLabel: "Latin, Latin Extended, Devanagari (₹)",
    supportedRanges: [
      ...LATIN_BASIC_AND_PUNCTUATION,
      ...LATIN_EXTENDED,
      ...DEVANAGARI_RANGES,
    ],
    previewSample: "Clear notebook script with crisp readability.",
    description: "Balanced ballpoint-style script supporting English & Devanagari.",
    licenseName: "SIL Open Font License 1.1",
    licensePath: "/fonts/licenses/Kalam-OFL.txt",
    copyright: "Copyright (c) 2014 Indian Type Foundry",
    fontSizeScale: 1.0,
  },
  {
    id: "caveat",
    name: "Caveat",
    family: "Caveat",
    fallbackFamily: "cursive",
    cssFontFamily: '"Caveat", cursive',
    availableWeights: [400, 500, 600, 700],
    boldWeight: 700,
    supportsTrueBold: true,
    supportsTrueItalic: false,
    supportedRangeLabel: "Latin, Latin Extended, Cyrillic",
    supportedRanges: [
      ...LATIN_BASIC_AND_PUNCTUATION,
      ...LATIN_EXTENDED,
      ...CYRILLIC_RANGES,
    ],
    previewSample: "Relaxed cursive flow for personal notes and letters.",
    description: "Expressive brush-like handwriting with natural slant.",
    licenseName: "SIL Open Font License 1.1",
    licensePath: "/fonts/licenses/Caveat-OFL.txt",
    copyright: "Copyright 2014 The Caveat Project Authors",
    fontSizeScale: 1.18,
  },
  {
    id: "patrick-hand",
    name: "Patrick Hand",
    family: "Patrick Hand",
    fallbackFamily: "cursive",
    cssFontFamily: '"Patrick Hand", cursive',
    availableWeights: [400],
    boldWeight: 700,
    supportsTrueBold: false,
    supportsTrueItalic: false,
    supportedRangeLabel: "Latin, Latin Extended, Vietnamese",
    supportedRanges: [
      ...LATIN_BASIC_AND_PUNCTUATION,
      ...LATIN_EXTENDED,
      ...VIETNAMESE_RANGES,
    ],
    previewSample: "Neat printed lettering for practice sheets and lists.",
    description: "Clean, upright pen lettering ideal for legible worksheets.",
    licenseName: "SIL Open Font License 1.1",
    licensePath: "/fonts/licenses/PatrickHand-OFL.txt",
    copyright: "Copyright (c) 2010-2012 Patrick Wagesreiter",
    fontSizeScale: 1.04,
  },
];

export function getHandwritingFont(
  fontId: HandwritingFontId
): HandwritingFontDefinition {
  return (
    HANDWRITING_FONTS.find((font) => font.id === fontId) ?? HANDWRITING_FONTS[0]
  );
}

function isCodePointInRanges(
  cp: number,
  ranges: UnicodeRangeTuple[]
): boolean {
  for (let i = 0; i < ranges.length; i += 1) {
    const r = ranges[i];
    if (cp >= r.start && cp <= r.end) return true;
  }
  return false;
}

export function findUnsupportedCharacters(
  text: string,
  fontId: HandwritingFontId,
  maxSamples = 5
): string[] {
  const font = getHandwritingFont(fontId);
  const unsupported: string[] = [];
  const seen = new Set<string>();

  for (const ch of text) {
    if (ch === "\n" || ch === "\r" || ch === "\t" || ch === " ") continue;
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp < 0x20) continue;
    // Bullets used internally by list renderer
    if (cp === 0x2022) continue;

    if (!isCodePointInRanges(cp, font.supportedRanges)) {
      if (!seen.has(ch)) {
        seen.add(ch);
        unsupported.push(ch);
        if (unsupported.length >= maxSamples) break;
      }
    }
  }

  return unsupported;
}

export interface FontLoadResult {
  fontId: HandwritingFontId;
  loaded: boolean;
  status: FontLoadStatus;
  error?: string;
}

export async function ensureHandwritingFontLoaded(
  fontId: HandwritingFontId
): Promise<FontLoadResult> {
  const font = getHandwritingFont(fontId);

  if (typeof document === "undefined" || !("fonts" in document)) {
    return {
      fontId,
      loaded: false,
      status: "error",
      error: "Browser Font Loading API is unavailable.",
    };
  }

  try {
    await document.fonts.ready;

    const loadPromises: Promise<FontFace[]>[] = [
      document.fonts.load(`400 18px "${font.family}"`, "AaBbCc123"),
    ];
    if (font.supportsTrueBold) {
      loadPromises.push(
        document.fonts.load(
          `${font.boldWeight} 18px "${font.family}"`,
          "AaBbCc123"
        )
      );
    }

    await Promise.all(loadPromises);
    await document.fonts.ready;

    const isLoaded = document.fonts.check(`400 18px "${font.family}"`);
    if (!isLoaded) {
      return {
        fontId,
        loaded: false,
        status: "error",
        error: `Font "${font.name}" did not become active in this browser.`,
      };
    }

    return {
      fontId,
      loaded: true,
      status: "ready",
    };
  } catch {
    return {
      fontId,
      loaded: false,
      status: "error",
      error: `Could not load "${font.name}" font files.`,
    };
  }
}

export async function preloadAllHandwritingFonts(): Promise<
  Record<HandwritingFontId, FontLoadStatus>
> {
  const entries = await Promise.all(
    HANDWRITING_FONTS.map(async (f) => {
      const res = await ensureHandwritingFontLoaded(f.id);
      return [f.id, res.status] as const;
    })
  );
  return Object.fromEntries(entries) as Record<
    HandwritingFontId,
    FontLoadStatus
  >;
}

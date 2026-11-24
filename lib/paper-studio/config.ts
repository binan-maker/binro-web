export type PaperFormatId = "a4" | "a5" | "letter";
export type PageOrientation = "portrait" | "landscape";
export type PaperTypeId = "plain" | "ruled" | "college" | "grid" | "dotted";
export type TextAlignOption = "left" | "center" | "right" | "justify";
export type VariationLevel = "off" | "subtle" | "moderate";
export type HandwritingFontId = "caveat" | "kalam" | "patrick-hand";

export interface PaperFormatSpec {
  id: PaperFormatId;
  label: string;
  widthMm: number;
  heightMm: number;
  widthPt: number;
  heightPt: number;
  summary: string;
}

export const MM_TO_CSS_PX = 96 / 25.4; // 3.7795275591 px per mm at 96 DPI
export const PT_TO_CSS_PX = 96 / 72; // 1.3333333333 px per pt at 96 DPI

export const PAPER_FORMATS: Record<PaperFormatId, PaperFormatSpec> = {
  a4: {
    id: "a4",
    label: "A4",
    widthMm: 210,
    heightMm: 297,
    widthPt: 595.28,
    heightPt: 841.89,
    summary: "210 × 297 mm",
  },
  a5: {
    id: "a5",
    label: "A5",
    widthMm: 148,
    heightMm: 210,
    widthPt: 419.53,
    heightPt: 595.28,
    summary: "148 × 210 mm",
  },
  letter: {
    id: "letter",
    label: "US Letter",
    widthMm: 215.9,
    heightMm: 279.4,
    widthPt: 612,
    heightPt: 792,
    summary: "8.5 × 11 in",
  },
};

export interface PaperTypeSpec {
  id: PaperTypeId;
  label: string;
  description: string;
  defaultRuleSpacingMm: number;
  defaultShowMarginLine: boolean;
}

export const PAPER_TYPES: PaperTypeSpec[] = [
  {
    id: "plain",
    label: "Plain white",
    description: "Clean unlined sheet",
    defaultRuleSpacingMm: 8,
    defaultShowMarginLine: false,
  },
  {
    id: "ruled",
    label: "Ruled notebook",
    description: "Wide horizontal rules",
    defaultRuleSpacingMm: 8.5,
    defaultShowMarginLine: true,
  },
  {
    id: "college",
    label: "College-ruled",
    description: "Tighter 7.1 mm rules",
    defaultRuleSpacingMm: 7.1,
    defaultShowMarginLine: true,
  },
  {
    id: "grid",
    label: "Grid paper",
    description: "Precision square grid",
    defaultRuleSpacingMm: 5,
    defaultShowMarginLine: false,
  },
  {
    id: "dotted",
    label: "Dotted paper",
    description: "Subtle dot matrix",
    defaultRuleSpacingMm: 5,
    defaultShowMarginLine: false,
  },
];

export interface ColorPreset {
  id: string;
  label: string;
  hex: string;
}

export const INK_PRESETS: ColorPreset[] = [
  { id: "blue", label: "Blue", hex: "#1D4ED8" },
  { id: "black", label: "Black", hex: "#1E293B" },
  { id: "red", label: "Red", hex: "#B91C1C" },
];

export const PAPER_COLOR_PRESETS: ColorPreset[] = [
  { id: "white", label: "Pure white", hex: "#FFFFFF" },
  { id: "cream", label: "Warm cream", hex: "#FAF7F0" },
  { id: "ivory", label: "Soft ivory", hex: "#F5F2EB" },
  { id: "ice", label: "Cool tint", hex: "#F7FAFC" },
];

export interface MarginsMm {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PaperStudioSettings {
  fontId: HandwritingFontId;
  fontSizePt: number;
  inkColor: string;
  lineSpacing: number;
  wordSpacingPx: number;
  paragraphSpacingPx: number;
  textAlign: TextAlignOption;
  textOffsetXMm: number;
  textOffsetYMm: number;
  paperFormat: PaperFormatId;
  orientation: PageOrientation;
  paperType: PaperTypeId;
  paperColor: string;
  ruleColor: string;
  marginLineColor: string;
  ruleSpacingMm: number;
  gridSpacingMm: number;
  showMarginLine: boolean;
  marginsMm: MarginsMm;
  variationLevel: VariationLevel;
  variationSeed: number;
}

export const SETTING_LIMITS = {
  fontSizePt: { min: 10, max: 28, step: 0.5 },
  lineSpacing: { min: 1.2, max: 2.3, step: 0.05 },
  wordSpacingPx: { min: -1, max: 8, step: 0.5 },
  paragraphSpacingPx: { min: 0, max: 28, step: 2 },
  ruleSpacingMm: { min: 5, max: 14, step: 0.1 },
  gridSpacingMm: { min: 3.5, max: 12, step: 0.5 },
  marginMm: { min: 6, max: 45, step: 1 },
  offsetMm: { min: -8, max: 8, step: 0.5 },
} as const;

export const DEFAULT_STUDIO_SETTINGS: PaperStudioSettings = {
  fontId: "kalam",
  fontSizePt: 14.5,
  inkColor: "#1D4ED8",
  lineSpacing: 1.55,
  wordSpacingPx: 0.5,
  paragraphSpacingPx: 6,
  textAlign: "left",
  textOffsetXMm: 0,
  textOffsetYMm: 0,
  paperFormat: "a4",
  orientation: "portrait",
  paperType: "ruled",
  paperColor: "#FFFFFF",
  ruleColor: "#C5D4E0",
  marginLineColor: "#E18D8D",
  ruleSpacingMm: 8.5,
  gridSpacingMm: 5,
  showMarginLine: true,
  marginsMm: {
    top: 20,
    bottom: 18,
    left: 22,
    right: 16,
  },
  variationLevel: "subtle",
  variationSeed: 104729,
};

export interface PageDimensions {
  widthMm: number;
  heightMm: number;
  widthPt: number;
  heightPt: number;
  widthPx: number;
  heightPx: number;
}

export function getPageDimensions(
  formatId: PaperFormatId,
  orientation: PageOrientation
): PageDimensions {
  const spec = PAPER_FORMATS[formatId];
  const isLandscape = orientation === "landscape";
  const widthMm = isLandscape ? spec.heightMm : spec.widthMm;
  const heightMm = isLandscape ? spec.widthMm : spec.heightMm;
  const widthPt = isLandscape ? spec.heightPt : spec.widthPt;
  const heightPt = isLandscape ? spec.widthPt : spec.heightPt;

  return {
    widthMm,
    heightMm,
    widthPt,
    heightPt,
    widthPx: widthMm * MM_TO_CSS_PX,
    heightPx: heightMm * MM_TO_CSS_PX,
  };
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeHexColor(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return fallback;
}

export function normalizeStudioSettings(
  settings: PaperStudioSettings
): PaperStudioSettings {
  const dims = getPageDimensions(settings.paperFormat, settings.orientation);
  const maxHorizontalMargin = Math.max(
    SETTING_LIMITS.marginMm.min,
    Math.floor((dims.widthMm - 40) / 2)
  );
  const maxVerticalMargin = Math.max(
    SETTING_LIMITS.marginMm.min,
    Math.floor((dims.heightMm - 50) / 2)
  );

  return {
    ...settings,
    fontSizePt: clampNumber(
      settings.fontSizePt,
      SETTING_LIMITS.fontSizePt.min,
      SETTING_LIMITS.fontSizePt.max
    ),
    inkColor: sanitizeHexColor(settings.inkColor, "#1D4ED8"),
    paperColor: sanitizeHexColor(settings.paperColor, "#FFFFFF"),
    ruleColor: sanitizeHexColor(settings.ruleColor, "#C5D4E0"),
    marginLineColor: sanitizeHexColor(settings.marginLineColor, "#E18D8D"),
    lineSpacing: clampNumber(
      settings.lineSpacing,
      SETTING_LIMITS.lineSpacing.min,
      SETTING_LIMITS.lineSpacing.max
    ),
    wordSpacingPx: clampNumber(
      settings.wordSpacingPx,
      SETTING_LIMITS.wordSpacingPx.min,
      SETTING_LIMITS.wordSpacingPx.max
    ),
    paragraphSpacingPx: clampNumber(
      settings.paragraphSpacingPx,
      SETTING_LIMITS.paragraphSpacingPx.min,
      SETTING_LIMITS.paragraphSpacingPx.max
    ),
    ruleSpacingMm: clampNumber(
      settings.ruleSpacingMm,
      SETTING_LIMITS.ruleSpacingMm.min,
      SETTING_LIMITS.ruleSpacingMm.max
    ),
    gridSpacingMm: clampNumber(
      settings.gridSpacingMm,
      SETTING_LIMITS.gridSpacingMm.min,
      SETTING_LIMITS.gridSpacingMm.max
    ),
    textOffsetXMm: clampNumber(
      settings.textOffsetXMm,
      SETTING_LIMITS.offsetMm.min,
      SETTING_LIMITS.offsetMm.max
    ),
    textOffsetYMm: clampNumber(
      settings.textOffsetYMm,
      SETTING_LIMITS.offsetMm.min,
      SETTING_LIMITS.offsetMm.max
    ),
    marginsMm: {
      top: clampNumber(
        settings.marginsMm.top,
        SETTING_LIMITS.marginMm.min,
        Math.min(SETTING_LIMITS.marginMm.max, maxVerticalMargin)
      ),
      bottom: clampNumber(
        settings.marginsMm.bottom,
        SETTING_LIMITS.marginMm.min,
        Math.min(SETTING_LIMITS.marginMm.max, maxVerticalMargin)
      ),
      left: clampNumber(
        settings.marginsMm.left,
        SETTING_LIMITS.marginMm.min,
        Math.min(SETTING_LIMITS.marginMm.max, maxHorizontalMargin)
      ),
      right: clampNumber(
        settings.marginsMm.right,
        SETTING_LIMITS.marginMm.min,
        Math.min(SETTING_LIMITS.marginMm.max, maxHorizontalMargin)
      ),
    },
  };
}

export function sanitizeExportFilename(raw: string): string {
  const stem = raw
    .trim()
    .replace(/\.(pdf|png|zip)$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return stem || "binro-paper-studio";
}

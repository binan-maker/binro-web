"use client";

import { useId, useState, type ReactNode } from "react";
import {
  INK_PRESETS,
  PAPER_COLOR_PRESETS,
  PAPER_FORMATS,
  PAPER_TYPES,
  SETTING_LIMITS,
  type PageOrientation,
  type PaperFormatId,
  type PaperStudioSettings,
  type PaperTypeId,
  type TextAlignOption,
  type VariationLevel,
} from "@/lib/paper-studio/config";
import {
  HANDWRITING_FONTS,
  type FontLoadStatus,
} from "@/lib/paper-studio/fonts";
import type { ExportProgress } from "@/lib/paper-studio/exporter";
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
} from "@/components/ui/Icons";
import {
  ToolProgressCard,
  ToolResultHeader,
} from "@/components/utilities/ToolUI";

interface PaperStudioControlsProps {
  settings: PaperStudioSettings;
  onUpdateSettings: (patch: Partial<PaperStudioSettings>) => void;
  onUpdateMargins: (patch: Partial<PaperStudioSettings["marginsMm"]>) => void;
  onShuffleSeed: () => void;
  onResetDefaults: () => void;
  fontStatuses: Record<string, FontLoadStatus>;
  filename: string;
  onChangeFilename: (val: string) => void;
  pageCount: number;
  currentPageNumber: number;
  isExporting: boolean;
  exportProgress: ExportProgress | null;
  lastExportSummary: { label: string; downloadUrl: string; filename: string } | null;
  onExportPdf: () => void;
  onExportCurrentPng: () => void;
  onExportAllPngZip: () => void;
  onPrint: () => void;
  onCancelExport: () => void;
  sectionMode?: "all" | "customize" | "export";
}

function CollapsibleSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#D4DDE2] last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F6F7]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5C7E8F]"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#20272B]">{title}</p>
          {subtitle ? (
            <p className="truncate text-xs text-[#556168]">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-[#466677] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? <div className="space-y-4 px-4 pb-4 pt-1">{children}</div> : null}
    </div>
  );
}

export function PaperStudioControls({
  settings,
  onUpdateSettings,
  onUpdateMargins,
  onShuffleSeed,
  onResetDefaults,
  fontStatuses,
  filename,
  onChangeFilename,
  pageCount,
  currentPageNumber,
  isExporting,
  exportProgress,
  lastExportSummary,
  onExportPdf,
  onExportCurrentPng,
  onExportAllPngZip,
  onPrint,
  onCancelExport,
  sectionMode = "all",
}: PaperStudioControlsProps) {
  const uid = useId();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    handwriting: true,
    paper: true,
    ink: false,
    margins: false,
    export: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFont =
    HANDWRITING_FONTS.find((f) => f.id === settings.fontId) ??
    HANDWRITING_FONTS[0];
  const activePaperSpec = PAPER_FORMATS[settings.paperFormat];
  const activePaperType =
    PAPER_TYPES.find((t) => t.id === settings.paperType) ?? PAPER_TYPES[0];

  const showCustomize = sectionMode === "all" || sectionMode === "customize";
  const showExport = sectionMode === "all" || sectionMode === "export";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D4DDE2] bg-white shadow-[0_1px_2px_rgba(32,39,43,0.03)]">
      {showCustomize ? (
        <>
          <div className="flex items-center justify-between border-b border-[#D4DDE2] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#20272B]">
                Style & Layout
              </h2>
              <p className="text-xs text-[#556168]">
                {activePaperSpec.label} {settings.orientation} ·{" "}
                {activeFont.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onResetDefaults}
              className="min-h-[32px] rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Reset
            </button>
          </div>

          {/* 1. Handwriting Font & Natural Variation */}
          <CollapsibleSection
            title="Handwriting"
            subtitle={`${activeFont.name} · ${settings.fontSizePt} pt · Variation: ${settings.variationLevel}`}
            isOpen={openSections.handwriting}
            onToggle={() => toggleSection("handwriting")}
          >
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#466677]">
                Font style
              </span>
              <div className="space-y-2">
                {HANDWRITING_FONTS.map((font) => {
                  const selected = settings.fontId === font.id;
                  const status = fontStatuses[font.id] ?? "loading";
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => onUpdateSettings({ fontId: font.id })}
                      aria-pressed={selected}
                      className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        selected
                          ? "border-[#426579] bg-[#F3F6F7]"
                          : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]/70 hover:bg-[#F3F6F7]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#20272B]">
                          {font.name}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            status === "ready"
                              ? "text-[#0E6B56]"
                              : status === "error"
                                ? "text-[#9B2C2C]"
                                : "text-[#466677]"
                          }`}
                        >
                          {status === "ready"
                            ? "Ready"
                            : status === "error"
                              ? "Unavailable"
                              : "Loading…"}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-base leading-snug text-[#20272B]"
                        style={{ fontFamily: font.cssFontFamily }}
                      >
                        {font.previewSample}
                      </p>
                      <p className="mt-1 text-[11px] text-[#556168]">
                        {font.supportedRangeLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#466677]">Font weight</span>
                <span className="font-mono text-[#556168] tabular-nums">
                  {settings.fontWeight}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeFont.availableWeights.map((weight) => {
                  const active = settings.fontWeight === weight;
                  const label =
                    weight === 300
                      ? "Light"
                      : weight === 400
                        ? "Regular"
                        : weight === 500
                          ? "Medium"
                          : weight === 600
                            ? "Semi"
                            : "Bold";
                  return (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => onUpdateSettings({ fontWeight: weight })}
                      aria-pressed={active}
                      className={`min-h-[34px] flex-1 rounded-lg border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        active
                          ? "border-[#426579] bg-[#426579] text-white"
                          : "border-[#D4DDE2] bg-white text-[#20272B] hover:bg-[#F3F6F7]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`${uid}-font-size`}
                  className="font-medium text-[#466677]"
                >
                  Font size
                </label>
                <span className="font-mono text-[#20272B] tabular-nums">
                  {settings.fontSizePt} pt
                </span>
              </div>
              <input
                id={`${uid}-font-size`}
                type="range"
                min={SETTING_LIMITS.fontSizePt.min}
                max={SETTING_LIMITS.fontSizePt.max}
                step={SETTING_LIMITS.fontSizePt.step}
                value={settings.fontSizePt}
                onChange={(e) =>
                  onUpdateSettings({ fontSizePt: Number(e.target.value) })
                }
                className="mt-1.5 w-full accent-[#426579]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#466677]">
                  Natural variation
                </span>
                <button
                  type="button"
                  disabled={settings.variationLevel === "off"}
                  onClick={onShuffleSeed}
                  className="text-xs font-medium text-[#426579] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  New seed
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["off", "subtle", "moderate"] as VariationLevel[]).map(
                  (lvl) => {
                    const active = settings.variationLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ variationLevel: lvl })
                        }
                        aria-pressed={active}
                        className={`min-h-[36px] rounded-lg border px-2 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          active
                            ? "border-[#426579] bg-[#426579] text-white"
                            : "border-[#D4DDE2] bg-white text-[#20272B] hover:bg-[#F3F6F7]"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  }
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-[#556168]">
                Deterministic subtle spacing and baseline rhythm across lines.
              </p>
            </div>
          </CollapsibleSection>

          {/* 2. Paper Format, Orientation & Background */}
          <CollapsibleSection
            title="Paper"
            subtitle={`${activePaperSpec.label} · ${activePaperType.label}`}
            isOpen={openSections.paper}
            onToggle={() => toggleSection("paper")}
          >
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[#466677]">
                Page size
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(PAPER_FORMATS) as PaperFormatId[]).map((id) => {
                  const fmt = PAPER_FORMATS[id];
                  const active = settings.paperFormat === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onUpdateSettings({ paperFormat: id })}
                      aria-pressed={active}
                      className={`min-h-[42px] rounded-lg border px-2 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        active
                          ? "border-[#426579] bg-[#426579] text-white"
                          : "border-[#D4DDE2] bg-white text-[#20272B] hover:bg-[#F3F6F7]"
                      }`}
                    >
                      <span className="block text-xs font-semibold">
                        {fmt.label}
                      </span>
                      <span
                        className={`block text-[10px] ${
                          active ? "text-white/80" : "text-[#556168]"
                        }`}
                      >
                        {fmt.summary}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[#466677]">
                Orientation
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(["portrait", "landscape"] as PageOrientation[]).map((ori) => {
                  const active = settings.orientation === ori;
                  return (
                    <button
                      key={ori}
                      type="button"
                      onClick={() => onUpdateSettings({ orientation: ori })}
                      aria-pressed={active}
                      className={`min-h-[36px] rounded-lg border px-3 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        active
                          ? "border-[#426579] bg-[#426579] text-white"
                          : "border-[#D4DDE2] bg-white text-[#20272B] hover:bg-[#F3F6F7]"
                      }`}
                    >
                      {ori}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`${uid}-paper-type`}
                className="block text-xs font-medium text-[#466677]"
              >
                Paper style
              </label>
              <select
                id={`${uid}-paper-type`}
                value={settings.paperType}
                onChange={(e) => {
                  const nextType = e.target.value as PaperTypeId;
                  const spec = PAPER_TYPES.find((t) => t.id === nextType);
                  onUpdateSettings({
                    paperType: nextType,
                    ruleSpacingMm:
                      nextType === "ruled" || nextType === "college"
                        ? spec?.defaultRuleSpacingMm ?? settings.ruleSpacingMm
                        : settings.ruleSpacingMm,
                    gridSpacingMm:
                      nextType === "grid" || nextType === "dotted"
                        ? spec?.defaultRuleSpacingMm ?? settings.gridSpacingMm
                        : settings.gridSpacingMm,
                    showMarginLine:
                      spec?.defaultShowMarginLine ?? settings.showMarginLine,
                  });
                }}
                className="min-h-[40px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 text-xs font-medium text-[#20272B] focus:border-[#426579] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
              >
                {PAPER_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label} — {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#466677]">
                Paper tint
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PAPER_COLOR_PRESETS.map((preset) => {
                  const active =
                    settings.paperColor.toUpperCase() === preset.hex;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ paperColor: preset.hex })
                      }
                      title={preset.label}
                      aria-label={`Paper color ${preset.label}`}
                      aria-pressed={active}
                      className={`h-7 w-7 rounded-full border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        active
                          ? "scale-110 border-[#426579] ring-2 ring-[#426579]/30"
                          : "border-[#D4DDE2] hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  );
                })}
                <label className="inline-flex items-center gap-1.5 text-xs text-[#556168]">
                  <span className="sr-only">Custom paper color</span>
                  <input
                    type="color"
                    aria-label="Custom paper background color"
                    value={settings.paperColor}
                    onChange={(e) =>
                      onUpdateSettings({
                        paperColor: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-7 w-8 cursor-pointer rounded border border-[#D4DDE2] bg-white p-0.5"
                  />
                  <span className="font-mono text-[11px]">Custom</span>
                </label>
              </div>
            </div>

            {settings.paperType !== "plain" ? (
              <div className="space-y-3 rounded-xl border border-[#D4DDE2]/80 bg-[#F3F6F7]/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`${uid}-rule-color`}
                    className="text-xs font-medium text-[#466677]"
                  >
                    {settings.paperType === "dotted"
                      ? "Dot color"
                      : settings.paperType === "grid"
                        ? "Grid color"
                        : "Rule color"}
                  </label>
                  <input
                    id={`${uid}-rule-color`}
                    type="color"
                    value={settings.ruleColor}
                    onChange={(e) =>
                      onUpdateSettings({
                        ruleColor: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-6 w-8 cursor-pointer rounded border border-[#D4DDE2] bg-white p-0.5"
                  />
                </div>

                {settings.paperType === "ruled" ||
                settings.paperType === "college" ? (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`${uid}-rule-spacing`}
                        className="font-medium text-[#466677]"
                      >
                        Rule spacing
                      </label>
                      <span className="font-mono text-[#20272B] tabular-nums">
                        {settings.ruleSpacingMm.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      id={`${uid}-rule-spacing`}
                      type="range"
                      min={SETTING_LIMITS.ruleSpacingMm.min}
                      max={SETTING_LIMITS.ruleSpacingMm.max}
                      step={SETTING_LIMITS.ruleSpacingMm.step}
                      value={settings.ruleSpacingMm}
                      onChange={(e) =>
                        onUpdateSettings({
                          ruleSpacingMm: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full accent-[#426579]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`${uid}-grid-spacing`}
                        className="font-medium text-[#466677]"
                      >
                        {settings.paperType === "dotted"
                          ? "Dot spacing"
                          : "Grid spacing"}
                      </label>
                      <span className="font-mono text-[#20272B] tabular-nums">
                        {settings.gridSpacingMm.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      id={`${uid}-grid-spacing`}
                      type="range"
                      min={SETTING_LIMITS.gridSpacingMm.min}
                      max={SETTING_LIMITS.gridSpacingMm.max}
                      step={SETTING_LIMITS.gridSpacingMm.step}
                      value={settings.gridSpacingMm}
                      onChange={(e) =>
                        onUpdateSettings({
                          gridSpacingMm: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full accent-[#426579]"
                    />
                  </div>
                )}

                {settings.paperType !== "dotted" ? (
                  <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#20272B]">
                    <span>Show left margin line</span>
                    <input
                      type="checkbox"
                      checked={settings.showMarginLine}
                      onChange={(e) =>
                        onUpdateSettings({ showMarginLine: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#426579]"
                    />
                  </label>
                ) : null}
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#20272B]">
                <span>Show left margin line</span>
                <input
                  type="checkbox"
                  checked={settings.showMarginLine}
                  onChange={(e) =>
                    onUpdateSettings({ showMarginLine: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#426579]"
                />
              </label>
            )}
          </CollapsibleSection>

          {/* 3. Ink & Typography */}
          <CollapsibleSection
            title="Ink & Typography"
            subtitle={`Align: ${settings.textAlign} · Line ${settings.lineSpacing.toFixed(2)}×`}
            isOpen={openSections.ink}
            onToggle={() => toggleSection("ink")}
          >
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#466677]">
                Ink color
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {INK_PRESETS.map((preset) => {
                  const active =
                    settings.inkColor.toUpperCase() === preset.hex;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ inkColor: preset.hex })
                      }
                      aria-pressed={active}
                      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        active
                          ? "border-[#426579] bg-[#F3F6F7] text-[#20272B]"
                          : "border-[#D4DDE2] bg-white text-[#556168] hover:bg-[#F3F6F7]"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/15"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
                <label className="inline-flex items-center gap-1.5 text-xs text-[#556168]">
                  <span className="sr-only">Custom ink color</span>
                  <input
                    type="color"
                    aria-label="Custom ink color"
                    value={settings.inkColor}
                    onChange={(e) =>
                      onUpdateSettings({
                        inkColor: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-7 w-8 cursor-pointer rounded border border-[#D4DDE2] bg-white p-0.5"
                  />
                  <span className="font-mono text-[11px]">Custom</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[#466677]">
                Text alignment
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["left", "center", "right", "justify"] as TextAlignOption[]).map(
                  (align) => {
                    const active = settings.textAlign === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() => onUpdateSettings({ textAlign: align })}
                        aria-pressed={active}
                        className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          active
                            ? "border-[#426579] bg-[#426579] text-white"
                            : "border-[#D4DDE2] bg-white text-[#20272B] hover:bg-[#F3F6F7]"
                        }`}
                      >
                        {align}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`${uid}-line-spacing`}
                  className="font-medium text-[#466677]"
                >
                  Line spacing
                </label>
                <span className="font-mono text-[#20272B] tabular-nums">
                  {settings.lineSpacing.toFixed(2)}×
                </span>
              </div>
              <input
                id={`${uid}-line-spacing`}
                type="range"
                min={SETTING_LIMITS.lineSpacing.min}
                max={SETTING_LIMITS.lineSpacing.max}
                step={SETTING_LIMITS.lineSpacing.step}
                value={settings.lineSpacing}
                onChange={(e) =>
                  onUpdateSettings({ lineSpacing: Number(e.target.value) })
                }
                className="mt-1 w-full accent-[#426579]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`${uid}-word-spacing`}
                  className="font-medium text-[#466677]"
                >
                  Word spacing
                </label>
                <span className="font-mono text-[#20272B] tabular-nums">
                  {settings.wordSpacingPx >= 0 ? "+" : ""}
                  {settings.wordSpacingPx} px
                </span>
              </div>
              <input
                id={`${uid}-word-spacing`}
                type="range"
                min={SETTING_LIMITS.wordSpacingPx.min}
                max={SETTING_LIMITS.wordSpacingPx.max}
                step={SETTING_LIMITS.wordSpacingPx.step}
                value={settings.wordSpacingPx}
                onChange={(e) =>
                  onUpdateSettings({ wordSpacingPx: Number(e.target.value) })
                }
                className="mt-1 w-full accent-[#426579]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`${uid}-para-spacing`}
                  className="font-medium text-[#466677]"
                >
                  Paragraph spacing
                </label>
                <span className="font-mono text-[#20272B] tabular-nums">
                  {settings.paragraphSpacingPx} px
                </span>
              </div>
              <input
                id={`${uid}-para-spacing`}
                type="range"
                min={SETTING_LIMITS.paragraphSpacingPx.min}
                max={SETTING_LIMITS.paragraphSpacingPx.max}
                step={SETTING_LIMITS.paragraphSpacingPx.step}
                value={settings.paragraphSpacingPx}
                onChange={(e) =>
                  onUpdateSettings({
                    paragraphSpacingPx: Number(e.target.value),
                  })
                }
                className="mt-1 w-full accent-[#426579]"
              />
            </div>
          </CollapsibleSection>

          {/* 4. Margins & Fine Positioning */}
          <CollapsibleSection
            title="Margins & Position"
            subtitle={`T:${settings.marginsMm.top} B:${settings.marginsMm.bottom} L:${settings.marginsMm.left} R:${settings.marginsMm.right} mm`}
            isOpen={openSections.margins}
            onToggle={() => toggleSection("margins")}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-margin-top`}
                    className="font-medium text-[#466677]"
                  >
                    Top
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.marginsMm.top} mm
                  </span>
                </div>
                <input
                  id={`${uid}-margin-top`}
                  type="range"
                  min={SETTING_LIMITS.marginMm.min}
                  max={SETTING_LIMITS.marginMm.max}
                  step={SETTING_LIMITS.marginMm.step}
                  value={settings.marginsMm.top}
                  onChange={(e) =>
                    onUpdateMargins({ top: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-margin-bottom`}
                    className="font-medium text-[#466677]"
                  >
                    Bottom
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.marginsMm.bottom} mm
                  </span>
                </div>
                <input
                  id={`${uid}-margin-bottom`}
                  type="range"
                  min={SETTING_LIMITS.marginMm.min}
                  max={SETTING_LIMITS.marginMm.max}
                  step={SETTING_LIMITS.marginMm.step}
                  value={settings.marginsMm.bottom}
                  onChange={(e) =>
                    onUpdateMargins({ bottom: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-margin-left`}
                    className="font-medium text-[#466677]"
                  >
                    Left
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.marginsMm.left} mm
                  </span>
                </div>
                <input
                  id={`${uid}-margin-left`}
                  type="range"
                  min={SETTING_LIMITS.marginMm.min}
                  max={SETTING_LIMITS.marginMm.max}
                  step={SETTING_LIMITS.marginMm.step}
                  value={settings.marginsMm.left}
                  onChange={(e) =>
                    onUpdateMargins({ left: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-margin-right`}
                    className="font-medium text-[#466677]"
                  >
                    Right
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.marginsMm.right} mm
                  </span>
                </div>
                <input
                  id={`${uid}-margin-right`}
                  type="range"
                  min={SETTING_LIMITS.marginMm.min}
                  max={SETTING_LIMITS.marginMm.max}
                  step={SETTING_LIMITS.marginMm.step}
                  value={settings.marginsMm.right}
                  onChange={(e) =>
                    onUpdateMargins({ right: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#D4DDE2]/70 pt-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-offset-x`}
                    className="font-medium text-[#466677]"
                  >
                    Horizontal nudge
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.textOffsetXMm > 0 ? "+" : ""}
                    {settings.textOffsetXMm} mm
                  </span>
                </div>
                <input
                  id={`${uid}-offset-x`}
                  type="range"
                  min={SETTING_LIMITS.offsetMm.min}
                  max={SETTING_LIMITS.offsetMm.max}
                  step={SETTING_LIMITS.offsetMm.step}
                  value={settings.textOffsetXMm}
                  onChange={(e) =>
                    onUpdateSettings({ textOffsetXMm: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`${uid}-offset-y`}
                    className="font-medium text-[#466677]"
                  >
                    Vertical nudge
                  </label>
                  <span className="font-mono text-[#20272B] tabular-nums">
                    {settings.textOffsetYMm > 0 ? "+" : ""}
                    {settings.textOffsetYMm} mm
                  </span>
                </div>
                <input
                  id={`${uid}-offset-y`}
                  type="range"
                  min={SETTING_LIMITS.offsetMm.min}
                  max={SETTING_LIMITS.offsetMm.max}
                  step={SETTING_LIMITS.offsetMm.step}
                  value={settings.textOffsetYMm}
                  onChange={(e) =>
                    onUpdateSettings({ textOffsetYMm: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#426579]"
                />
              </div>
            </div>
          </CollapsibleSection>
        </>
      ) : null}

      {/* 5. Export & Print */}
      {showExport ? (
        <CollapsibleSection
          title="Export & Print"
          subtitle={`${pageCount} ${pageCount === 1 ? "page" : "pages"} · ${activePaperSpec.label}`}
          isOpen={sectionMode === "export" ? true : openSections.export}
          onToggle={() => {
            if (sectionMode !== "export") toggleSection("export");
          }}
        >
          <div>
            <label
              htmlFor={`${uid}-export-filename`}
              className="block text-xs font-medium text-[#466677]"
            >
              File name
            </label>
            <input
              id={`${uid}-export-filename`}
              type="text"
              value={filename}
              onChange={(e) => onChangeFilename(e.target.value)}
              placeholder="binro-paper-studio"
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 text-xs font-medium text-[#20272B] focus:border-[#426579] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
            />
          </div>

          {isExporting && exportProgress ? (
            <ToolProgressCard
              stageLabel={
                exportProgress.stage === "loading-fonts"
                  ? "Checking fonts"
                  : exportProgress.stage === "rendering"
                    ? "Rendering pages"
                    : exportProgress.stage === "building-pdf"
                      ? "Building PDF"
                      : exportProgress.stage === "packaging"
                        ? "Packaging ZIP"
                        : "Verifying"
              }
              detail={exportProgress.detail}
              percent={
                exportProgress.totalPages > 0
                  ? Math.round(
                      (exportProgress.currentPage / exportProgress.totalPages) *
                        100
                    )
                  : null
              }
              onCancel={onCancelExport}
            />
          ) : null}

          <div className="space-y-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={onExportPdf}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              <DownloadIcon className="h-4 w-4 shrink-0" />
              <span>
                {isExporting
                  ? "Exporting..."
                  : `Download PDF (${pageCount} ${pageCount === 1 ? "page" : "pages"})`}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={onExportCurrentPng}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Page {currentPageNumber} PNG
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={onExportAllPngZip}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                {pageCount > 1 ? "All PNGs (ZIP)" : "Save PNG"}
              </button>
            </div>

            <button
              type="button"
              disabled={isExporting}
              onClick={onPrint}
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/70 px-4 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Print sheets
            </button>
          </div>

          {lastExportSummary ? (
            <div className="rounded-xl border border-[#1CC8A0]/40 bg-[#EAFBF6]/60 p-3">
              <ToolResultHeader
                title={lastExportSummary.label}
                isCurrent
                rightContent={
                  <a
                    href={lastExportSummary.downloadUrl}
                    download={lastExportSummary.filename}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#0E6B56]/25 bg-white px-2.5 py-1 text-xs font-medium text-[#0E6B56] hover:bg-[#EAFBF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    <span>Save again</span>
                  </a>
                }
              />
            </div>
          ) : null}
        </CollapsibleSection>
      ) : null}
    </div>
  );
}

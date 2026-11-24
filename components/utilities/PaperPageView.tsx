"use client";

import { memo } from "react";
import { MM_TO_CSS_PX, type PaperStudioSettings } from "@/lib/paper-studio/config";
import { getHandwritingFont } from "@/lib/paper-studio/fonts";
import type { PaginatedPage } from "@/lib/paper-studio/pagination";

interface PaperPageViewProps {
  page: PaginatedPage;
  settings: PaperStudioSettings;
  scale?: number;
  forPrint?: boolean;
  showPageNumberBadge?: boolean;
}

export const PaperPageView = memo(function PaperPageView({
  page,
  settings,
  scale = 1,
  forPrint = false,
  showPageNumberBadge = false,
}: PaperPageViewProps) {
  const font = getHandwritingFont(settings.fontId);
  const ruleSpacingPx = settings.ruleSpacingMm * MM_TO_CSS_PX;
  const gridSpacingPx = settings.gridSpacingMm * MM_TO_CSS_PX;
  const firstRuleY = Math.max(10, page.contentRect.top);
  const marginLineX = Math.max(24, page.contentRect.left - 10);

  const scaledWidth = Math.round(page.widthPx * scale);
  const scaledHeight = Math.round(page.heightPx * scale);

  const paperSurface = (
    <div
      className={
        forPrint
          ? "paper-studio-print-sheet relative overflow-hidden select-none"
          : "relative overflow-hidden rounded-[2px] border border-[#D4DDE2]/90 shadow-[0_6px_22px_rgba(32,39,43,0.09),0_1px_3px_rgba(32,39,43,0.06)] select-text"
      }
      style={{
        width: forPrint ? `${page.widthMm}mm` : `${page.widthPx}px`,
        height: forPrint ? `${page.heightMm}mm` : `${page.heightPx}px`,
        backgroundColor: settings.paperColor,
        transform: forPrint ? undefined : `scale(${scale})`,
        transformOrigin: forPrint ? undefined : "top left",
      }}
      data-page-number={page.pageNumber}
    >
      {/* Paper ruling / grid / dots background layer (rendered with pure CSS gradients) */}
      {(settings.paperType === "ruled" || settings.paperType === "college") && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[8px]"
          style={{
            top: `${firstRuleY}px`,
            backgroundImage: `linear-gradient(to bottom, ${settings.ruleColor} 1px, transparent 1px)`,
            backgroundSize: `100% ${ruleSpacingPx}px`,
            backgroundRepeat: "repeat-y",
          }}
        />
      )}

      {settings.paperType === "grid" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${settings.ruleColor} 1px, transparent 1px), linear-gradient(to bottom, ${settings.ruleColor} 1px, transparent 1px)`,
            backgroundSize: `${gridSpacingPx}px ${gridSpacingPx}px`,
            backgroundPosition: `${gridSpacingPx}px ${gridSpacingPx}px`,
          }}
        />
      )}

      {settings.paperType === "dotted" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${settings.ruleColor} 0.95px, transparent 1.1px)`,
            backgroundSize: `${gridSpacingPx}px ${gridSpacingPx}px`,
          }}
        />
      )}

      {/* Optional vertical margin line */}
      {settings.showMarginLine && settings.paperType !== "dotted" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: `${marginLineX}px`,
            width: "1.25px",
            backgroundColor: settings.marginLineColor,
          }}
        />
      )}

      {/* Handwritten lines positioned deterministically from pagination engine */}
      <div
        className="relative h-full w-full"
        style={{
          fontFamily: font.cssFontFamily,
          color: settings.inkColor,
        }}
      >
        {page.lines.map((line) => {
          const lineTop = line.y + line.variation.baselineShiftPx;
          const baseWeight = line.baseFontWeight ?? settings.fontWeight;
          const boldWeight = line.boldFontWeight ?? font.boldWeight;
          return (
            <div
              key={line.lineIndex}
              className="absolute inset-x-0"
              style={{
                top: `${lineTop}px`,
                height: `${line.lineHeightPx}px`,
                lineHeight: `${line.lineHeightPx}px`,
                fontSize: `${line.fontSizePx}px`,
                opacity: line.variation.inkOpacity,
              }}
            >
              {line.listMarker && line.listMarkerX !== undefined ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 whitespace-pre"
                  style={{
                    left: `${line.listMarkerX}px`,
                    fontWeight: baseWeight,
                  }}
                >
                  {line.listMarker}
                </span>
              ) : null}

              {line.words.map((word, wIdx) => (
                <span
                  key={`${line.lineIndex}-${wIdx}`}
                  className="absolute whitespace-pre"
                  style={{
                    left: `${word.x}px`,
                    top: `${word.baselineShiftPx}px`,
                  }}
                >
                  {word.segments.map((seg, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontWeight: seg.bold ? boldWeight : baseWeight,
                        fontStyle: seg.italic ? "italic" : "normal",
                        textDecoration: seg.underline ? "underline" : undefined,
                        textUnderlineOffset: seg.underline ? "0.14em" : undefined,
                        textDecorationThickness: seg.underline ? "0.06em" : undefined,
                      }}
                    >
                      {seg.text}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {!forPrint && showPageNumberBadge ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-2 rounded bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-[#556168]"
        >
          {page.pageNumber}
        </span>
      ) : null}
    </div>
  );

  if (forPrint) {
    return paperSurface;
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
    >
      {paperSurface}
    </div>
  );
});

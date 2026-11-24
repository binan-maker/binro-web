"use client";

import { useEffect, useRef, useState } from "react";
import type { PaperStudioSettings } from "@/lib/paper-studio/config";
import type { PaginatedPage } from "@/lib/paper-studio/pagination";
import { PaperPageView } from "@/components/utilities/PaperPageView";

interface PaperStudioPreviewProps {
  pages: PaginatedPage[];
  settings: PaperStudioSettings;
  currentPage: number;
  onChangeCurrentPage: (pageNumber: number) => void;
  singlePageMode?: boolean;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.45;

export function PaperStudioPreview({
  pages,
  settings,
  currentPage,
  onChangeCurrentPage,
  singlePageMode = false,
}: PaperStudioPreviewProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [zoom, setZoom] = useState<number>(0.72);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  const firstPageWidth = pages[0]?.widthPx ?? 793.7;

  // Measure available preview container width for responsive fit-to-width
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const computedScale = fitToWidth
    ? Math.max(
        MIN_ZOOM,
        Math.min(1.15, (Math.max(240, containerWidth - 36)) / firstPageWidth)
      )
    : zoom;

  const zoomPercent = Math.round(computedScale * 100);

  const jumpToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(pages.length, pageNum));
    onChangeCurrentPage(clamped);

    if (!singlePageMode) {
      const target = pageRefs.current.get(clamped);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track visible page on scroll in desktop multi-page view
  useEffect(() => {
    if (singlePageMode) return;
    const root = viewportRef.current;
    if (!root) return;

    const handleScroll = () => {
      const rootRect = root.getBoundingClientRect();
      const targetY = rootRect.top + rootRect.height * 0.35;
      let bestPage = currentPage;
      let bestDist = Infinity;

      for (const [pageNum, el] of pageRefs.current.entries()) {
        const r = el.getBoundingClientRect();
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(center - targetY);
        if (dist < bestDist) {
          bestDist = dist;
          bestPage = pageNum;
        }
      }
      if (bestPage !== currentPage) {
        onChangeCurrentPage(bestPage);
      }
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, [singlePageMode, currentPage, onChangeCurrentPage]);

  const displayedPages = singlePageMode
    ? pages.filter((p) => p.pageNumber === currentPage)
    : pages;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D4DDE2] bg-white shadow-[0_1px_2px_rgba(32,39,43,0.03)]">
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4DDE2] px-3.5 py-2.5 sm:px-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => jumpToPage(currentPage - 1)}
            aria-label="Previous page"
            className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Prev
          </button>
          <span
            aria-live="polite"
            className="min-w-[84px] text-center font-mono text-xs font-medium text-[#20272B] tabular-nums"
          >
            Page {currentPage} / {pages.length}
          </span>
          <button
            type="button"
            disabled={currentPage >= pages.length}
            onClick={() => jumpToPage(currentPage + 1)}
            aria-label="Next page"
            className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setFitToWidth(false);
              setZoom(
                Math.max(
                  MIN_ZOOM,
                  Math.round((computedScale - 0.1) * 100) / 100
                )
              );
            }}
            aria-label="Zoom out"
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-sm font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            −
          </button>
          <span className="min-w-[44px] text-center font-mono text-xs text-[#556168] tabular-nums">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={() => {
              setFitToWidth(false);
              setZoom(
                Math.min(
                  MAX_ZOOM,
                  Math.round((computedScale + 0.1) * 100) / 100
                )
              );
            }}
            aria-label="Zoom in"
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-sm font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setFitToWidth(true)}
            aria-pressed={fitToWidth}
            className={`inline-flex min-h-[34px] items-center rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
              fitToWidth
                ? "border-[#426579] bg-[#F3F6F7] text-[#426579]"
                : "border-[#D4DDE2] bg-white text-[#556168] hover:bg-[#F3F6F7]"
            }`}
          >
            Fit width
          </button>
        </div>
      </div>

      {/* Scrollable Sheet Canvas */}
      <div
        ref={viewportRef}
        className="flex max-h-[74vh] min-h-[420px] flex-col items-center gap-6 overflow-auto bg-[#EDF1F4] p-4 sm:p-6 lg:max-h-[760px]"
      >
        {displayedPages.map((page) => (
          <div
            key={page.pageNumber}
            ref={(el) => {
              if (el) {
                pageRefs.current.set(page.pageNumber, el);
              } else {
                pageRefs.current.delete(page.pageNumber);
              }
            }}
            className="flex flex-col items-center gap-2"
          >
            <PaperPageView
              page={page}
              settings={settings}
              scale={computedScale}
            />
            <span className="font-mono text-[11px] text-[#556168] tabular-nums">
              Sheet {page.pageNumber} of {pages.length} · {page.widthMm} ×{" "}
              {page.heightMm} mm
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

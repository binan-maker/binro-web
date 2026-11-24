"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_STUDIO_SETTINGS,
  getPageDimensions,
  normalizeStudioSettings,
  sanitizeExportFilename,
  type HandwritingFontId,
  type PaperStudioSettings,
} from "@/lib/paper-studio/config";
import {
  SAMPLE_HANDWRITING_DOCUMENT,
  computeDocumentStats,
} from "@/lib/paper-studio/document";
import {
  ensureHandwritingFontLoaded,
  findUnsupportedCharacters,
  getHandwritingFont,
  preloadAllHandwritingFonts,
  type FontLoadStatus,
} from "@/lib/paper-studio/fonts";
import {
  createCanvasTextMeasurer,
  paginateDocument,
  type PaginatedDocument,
} from "@/lib/paper-studio/pagination";
import {
  exportAllPagesAsZipPng,
  exportDocumentToPdf,
  exportSinglePagePng,
  type ExportProgress,
} from "@/lib/paper-studio/exporter";
import { PaperPageView } from "@/components/utilities/PaperPageView";
import { PaperStudioEditor } from "@/components/utilities/PaperStudioEditor";
import { PaperStudioPreview } from "@/components/utilities/PaperStudioPreview";
import { PaperStudioControls } from "@/components/utilities/PaperStudioControls";
import { ToolErrorBanner, ToolPrivacyNote } from "@/components/utilities/ToolUI";

type MobileTab = "write" | "customize" | "preview" | "download";

const MAX_UNDO_HISTORY = 30;

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function PaperStudio() {
  const [text, setText] = useState<string>(SAMPLE_HANDWRITING_DOCUMENT);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastHistoryPushRef = useRef<number>(0);

  const [settings, setSettings] = useState<PaperStudioSettings>(
    DEFAULT_STUDIO_SETTINGS
  );
  const [debouncedText, setDebouncedText] = useState<string>(
    SAMPLE_HANDWRITING_DOCUMENT
  );
  const [debouncedSettings, setDebouncedSettings] =
    useState<PaperStudioSettings>(DEFAULT_STUDIO_SETTINGS);

  const [fontStatuses, setFontStatuses] = useState<
    Record<HandwritingFontId, FontLoadStatus>
  >({
    kalam: "loading",
    caveat: "loading",
    "patrick-hand": "loading",
  });
  const [fontReadyVersion, setFontReadyVersion] = useState<number>(0);
  const [isClientMounted, setIsClientMounted] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<MobileTab>("write");
  const [filename, setFilename] = useState<string>("binro-notes");

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null
  );
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [lastExportSummary, setLastExportSummary] = useState<{
    label: string;
    downloadUrl: string;
    filename: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastDownloadUrlRef = useRef<string | null>(null);

  const revokeLastDownloadUrl = () => {
    if (lastDownloadUrlRef.current) {
      URL.revokeObjectURL(lastDownloadUrlRef.current);
      lastDownloadUrlRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    preloadAllHandwritingFonts().then((statuses) => {
      if (cancelled) return;
      setFontStatuses(statuses);
      setIsClientMounted(true);
      setFontReadyVersion((v) => v + 1);
    });

    return () => {
      cancelled = true;
      abortControllerRef.current?.abort();
      if (lastDownloadUrlRef.current) {
        URL.revokeObjectURL(lastDownloadUrlRef.current);
        lastDownloadUrlRef.current = null;
      }
    };
  }, []);

  // Ensure selected font is explicitly verified whenever fontId changes
  useEffect(() => {
    let cancelled = false;
    const targetFontId = settings.fontId;

    ensureHandwritingFontLoaded(targetFontId).then((res) => {
      if (cancelled) return;
      setFontStatuses((prev) => {
        if (prev[targetFontId] === res.status) return prev;
        return { ...prev, [targetFontId]: res.status };
      });
      if (res.loaded) {
        setFontReadyVersion((v) => v + 1);
      } else if (res.error) {
        setErrorMessages([res.error]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [settings.fontId]);

  // Debounce expensive pagination updates for smooth typing on long documents
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 120);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSettings(settings);
    }, 60);
    return () => clearTimeout(timer);
  }, [settings]);

  const handleChangeText = useCallback(
    (next: string, immediateHistory = false) => {
      const now = Date.now();
      if (immediateHistory || now - lastHistoryPushRef.current > 1200) {
        setUndoStack((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), text]);
        setRedoStack([]);
        lastHistoryPushRef.current = now;
      }
      setText(next);
    },
    [text]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), text]);
    setText(previous);
  }, [undoStack, text]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), text]);
    setText(next);
  }, [redoStack, text]);

  const handleLoadSample = useCallback(() => {
    handleChangeText(SAMPLE_HANDWRITING_DOCUMENT, true);
  }, [handleChangeText]);

  const handleClearDocument = useCallback(() => {
    handleChangeText("", true);
    setCurrentPage(1);
  }, [handleChangeText]);

  const handleUpdateSettings = useCallback(
    (patch: Partial<PaperStudioSettings>) => {
      setSettings((prev) => normalizeStudioSettings({ ...prev, ...patch }));
    },
    []
  );

  const handleUpdateMargins = useCallback(
    (patch: Partial<PaperStudioSettings["marginsMm"]>) => {
      setSettings((prev) =>
        normalizeStudioSettings({
          ...prev,
          marginsMm: { ...prev.marginsMm, ...patch },
        })
      );
    },
    []
  );

  const handleShuffleSeed = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      variationSeed: ((prev.variationSeed * 1664525 + 1013904223) >>> 0) || 42,
    }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSettings(DEFAULT_STUDIO_SETTINGS);
  }, []);

  // Real measurement-based pagination (uses Canvas 2D once client & fonts are ready)
  const paginatedDoc: PaginatedDocument = useMemo(() => {
    const measurer = isClientMounted
      ? createCanvasTextMeasurer()
      : {
          measureWidth: (
            str: string,
            _family: string,
            fontSizePx: number,
            weight: number
          ) => str.length * fontSizePx * (weight >= 600 ? 0.52 : 0.48),
        };
    // Reference fontReadyVersion so pagination re-runs when WOFF2 fonts finish loading
    void fontReadyVersion;
    return paginateDocument(debouncedText, debouncedSettings, measurer);
  }, [debouncedText, debouncedSettings, isClientMounted, fontReadyVersion]);

  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    paginatedDoc.pages.length
  );

  const stats = useMemo(() => computeDocumentStats(text), [text]);
  const activeFont = getHandwritingFont(settings.fontId);
  const unsupportedChars = useMemo(
    () => findUnsupportedCharacters(text, settings.fontId),
    [text, settings.fontId]
  );

  const activePageDims = getPageDimensions(
    debouncedSettings.paperFormat,
    debouncedSettings.orientation
  );

  const handleExportPdf = async () => {
    if (isExporting) return;
    setErrorMessages([]);
    revokeLastDownloadUrl();
    setLastExportSummary(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExporting(true);
    setExportProgress({
      stage: "loading-fonts",
      currentPage: 0,
      totalPages: paginatedDoc.pages.length,
      detail: "Preparing export...",
    });

    try {
      const result = await exportDocumentToPdf(
        paginatedDoc,
        debouncedSettings,
        filename,
        (prog) => setExportProgress(prog),
        controller.signal
      );

      const blob = new Blob([new Uint8Array(result.bytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      lastDownloadUrlRef.current = url;

      setLastExportSummary({
        label: `PDF ready (${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"})`,
        downloadUrl: url,
        filename: result.filename,
      });
      triggerDownload(url, result.filename);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Could not export PDF. Try reducing page count or closing other tabs.";
      if (msg !== "Export cancelled.") {
        setErrorMessages([msg]);
      }
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleExportCurrentPng = async () => {
    if (isExporting) return;
    const targetPage =
      paginatedDoc.pages[safeCurrentPage - 1] ?? paginatedDoc.pages[0];
    if (!targetPage) return;

    setErrorMessages([]);
    revokeLastDownloadUrl();
    setLastExportSummary(null);
    setIsExporting(true);
    setExportProgress({
      stage: "rendering",
      currentPage: 1,
      totalPages: 1,
      detail: `Rendering page ${targetPage.pageNumber} as PNG...`,
    });

    try {
      const result = await exportSinglePagePng(
        targetPage,
        debouncedSettings,
        filename
      );
      const url = URL.createObjectURL(result.blob);
      lastDownloadUrlRef.current = url;

      setLastExportSummary({
        label: `Page ${targetPage.pageNumber} PNG ready (${result.widthPx} × ${result.heightPx} px)`,
        downloadUrl: url,
        filename: result.filename,
      });
      triggerDownload(url, result.filename);
    } catch (error) {
      setErrorMessages([
        error instanceof Error
          ? error.message
          : "Could not export PNG for this page.",
      ]);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportAllPngZip = async () => {
    if (isExporting) return;
    if (paginatedDoc.pages.length === 1) {
      await handleExportCurrentPng();
      return;
    }

    setErrorMessages([]);
    revokeLastDownloadUrl();
    setLastExportSummary(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExporting(true);
    setExportProgress({
      stage: "loading-fonts",
      currentPage: 0,
      totalPages: paginatedDoc.pages.length,
      detail: "Preparing PNG export...",
    });

    try {
      const result = await exportAllPagesAsZipPng(
        paginatedDoc,
        debouncedSettings,
        filename,
        (prog) => setExportProgress(prog),
        controller.signal
      );

      const url = URL.createObjectURL(result.blob);
      lastDownloadUrlRef.current = url;

      setLastExportSummary({
        label: `${result.pageCount} PNG pages packaged`,
        downloadUrl: url,
        filename: result.filename,
      });
      triggerDownload(url, result.filename);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Could not export PNG archive.";
      if (msg !== "Export cancelled.") {
        setErrorMessages([msg]);
      }
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handlePrint = async () => {
    setErrorMessages([]);
    const check = await ensureHandwritingFontLoaded(debouncedSettings.fontId);
    if (!check.loaded) {
      setErrorMessages([
        check.error ||
          "Handwriting font is still loading. Please wait a moment before printing.",
      ]);
      return;
    }
    window.print();
  };

  const handleCancelExport = () => {
    abortControllerRef.current?.abort();
  };

  const safeFilename = sanitizeExportFilename(filename);

  return (
    <>
      {/* Dynamic @page rule matching selected paper dimensions & orientation */}
      <style media="print">{`
        @page {
          size: ${activePageDims.widthMm}mm ${activePageDims.heightMm}mm;
          margin: 0;
        }
      `}</style>

      {/* Screen Workspace (Hidden during browser printing) */}
      <div className="paper-studio-no-print mx-auto max-w-[1320px] space-y-4">
        <ToolErrorBanner
          messages={errorMessages}
          onDismiss={() => setErrorMessages([])}
        />

        {/* Mobile & Tablet Workspace Switcher (< lg) */}
        <div
          role="tablist"
          aria-label="Paper Studio workspace sections"
          className="grid grid-cols-4 gap-1 rounded-xl border border-[#D4DDE2] bg-white p-1 lg:hidden"
        >
          {(
            [
              { id: "write", label: "Write" },
              { id: "customize", label: "Customize" },
              { id: "preview", label: `Preview (${paginatedDoc.pages.length})` },
              { id: "download", label: "Download" },
            ] as { id: MobileTab; label: string }[]
          ).map((tab) => {
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileTab(tab.id)}
                className={`min-h-[40px] rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                  active
                    ? "bg-[#426579] text-white"
                    : "text-[#556168] hover:bg-[#F3F6F7] hover:text-[#20272B]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Desktop 3-Pane Studio */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
          <div className="lg:col-span-4">
            <PaperStudioEditor
              text={text}
              onChangeText={handleChangeText}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onLoadSample={handleLoadSample}
              onClearDocument={handleClearDocument}
              stats={stats}
              estimatedPages={paginatedDoc.pages.length}
              unsupportedChars={unsupportedChars}
              fontName={activeFont.name}
            />
          </div>

          <div className="lg:col-span-5">
            <PaperStudioPreview
              pages={paginatedDoc.pages}
              settings={debouncedSettings}
              currentPage={safeCurrentPage}
              onChangeCurrentPage={setCurrentPage}
            />
          </div>

          <div className="lg:col-span-3">
            <PaperStudioControls
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onUpdateMargins={handleUpdateMargins}
              onShuffleSeed={handleShuffleSeed}
              onResetDefaults={handleResetDefaults}
              fontStatuses={fontStatuses}
              filename={safeFilename}
              onChangeFilename={setFilename}
              pageCount={paginatedDoc.pages.length}
              currentPageNumber={safeCurrentPage}
              isExporting={isExporting}
              exportProgress={exportProgress}
              lastExportSummary={lastExportSummary}
              onExportPdf={handleExportPdf}
              onExportCurrentPng={handleExportCurrentPng}
              onExportAllPngZip={handleExportAllPngZip}
              onPrint={handlePrint}
              onCancelExport={handleCancelExport}
              sectionMode="all"
            />
          </div>
        </div>

        {/* Mobile / Tablet Active Tab View (< lg) */}
        <div className="lg:hidden">
          {mobileTab === "write" ? (
            <PaperStudioEditor
              text={text}
              onChangeText={handleChangeText}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onLoadSample={handleLoadSample}
              onClearDocument={handleClearDocument}
              stats={stats}
              estimatedPages={paginatedDoc.pages.length}
              unsupportedChars={unsupportedChars}
              fontName={activeFont.name}
            />
          ) : null}

          {mobileTab === "customize" ? (
            <PaperStudioControls
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onUpdateMargins={handleUpdateMargins}
              onShuffleSeed={handleShuffleSeed}
              onResetDefaults={handleResetDefaults}
              fontStatuses={fontStatuses}
              filename={safeFilename}
              onChangeFilename={setFilename}
              pageCount={paginatedDoc.pages.length}
              currentPageNumber={safeCurrentPage}
              isExporting={isExporting}
              exportProgress={exportProgress}
              lastExportSummary={lastExportSummary}
              onExportPdf={handleExportPdf}
              onExportCurrentPng={handleExportCurrentPng}
              onExportAllPngZip={handleExportAllPngZip}
              onPrint={handlePrint}
              onCancelExport={handleCancelExport}
              sectionMode="customize"
            />
          ) : null}

          {mobileTab === "preview" ? (
            <PaperStudioPreview
              pages={paginatedDoc.pages}
              settings={debouncedSettings}
              currentPage={safeCurrentPage}
              onChangeCurrentPage={setCurrentPage}
              singlePageMode
            />
          ) : null}

          {mobileTab === "download" ? (
            <PaperStudioControls
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onUpdateMargins={handleUpdateMargins}
              onShuffleSeed={handleShuffleSeed}
              onResetDefaults={handleResetDefaults}
              fontStatuses={fontStatuses}
              filename={safeFilename}
              onChangeFilename={setFilename}
              pageCount={paginatedDoc.pages.length}
              currentPageNumber={safeCurrentPage}
              isExporting={isExporting}
              exportProgress={exportProgress}
              lastExportSummary={lastExportSummary}
              onExportPdf={handleExportPdf}
              onExportCurrentPng={handleExportCurrentPng}
              onExportAllPngZip={handleExportAllPngZip}
              onPrint={handlePrint}
              onCancelExport={handleCancelExport}
              sectionMode="export"
            />
          ) : null}
        </div>

        <ToolPrivacyNote text="Your text, fonts, and exported pages are processed locally in your browser — nothing is uploaded or stored on BinRo servers." />
      </div>

      {/* Print-Only Sheet Stack (Hidden on screen, clean edge-to-edge sheets on print) */}
      <div className="paper-studio-print-only hidden">
        {paginatedDoc.pages.map((page) => (
          <PaperPageView
            key={`print-${page.pageNumber}`}
            page={page}
            settings={debouncedSettings}
            forPrint
          />
        ))}
      </div>
    </>
  );
}

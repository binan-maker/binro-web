"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";
import {
  inspectSplitPdfFileInBrowser,
  splitPdfFileInBrowser,
} from "@/lib/pdf/pdf-split-client";
import {
  MAX_EVERY_PAGE_OUTPUTS,
  MAX_SPLIT_PDF_BYTES,
  MAX_SPLIT_RANGES,
  buildEveryPageSplitPlan,
  buildExtractPagesPlan,
  buildSplitByRangesPlan,
  cleanPdfStem,
  formatPdfBytes,
  padPageNumber,
  parsePageSelectionExpression,
  translateSplitPdfError,
  validateSplitFileMetadata,
  type PdfSplitInspection,
  type SplitMode,
  type SplitOutputPlan,
  type SplitProgress,
} from "@/lib/pdf/pdf-split";
import {
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  PdfDocumentIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import {
  ToolErrorBanner,
  ToolPrivacyNote,
  ToolProgressCard,
  ToolResultHeader,
  ToolUploadDropzone,
} from "@/components/utilities/ToolUI";

interface RangeRow {
  id: string;
  value: string;
}

interface OutputDownloadItem {
  id: string;
  filename: string;
  rangeLabel: string;
  pageCount: number;
  sizeBytes: number;
  url: string;
}

interface SplitResultState {
  outputs: OutputDownloadItem[];
  zipUrl: string | null;
  zipFilename: string | null;
  zipSizeBytes: number | null;
  sourcePageCount: number;
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  hasLinks: boolean;
  hasOutlines: boolean;
}

const STAGE_LABELS: Record<SplitProgress["stage"], string> = {
  reading: "Reading",
  splitting: "Creating files",
  packaging: "Packaging ZIP",
  verifying: "Verifying",
};

const PAGE_GRID_WINDOW = 60;

function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `range-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildInitialRanges(pageCount: number): RangeRow[] {
  if (pageCount <= 1) {
    return [{ id: createRowId(), value: "1" }];
  }
  const midpoint = Math.ceil(pageCount / 2);
  return [
    { id: createRowId(), value: `1-${midpoint}` },
    { id: createRowId(), value: `${midpoint + 1}-${pageCount}` },
  ];
}

function computeUncoveredRangeStrings(
  rangeInputs: string[],
  totalPages: number
): string[] {
  const covered = new Set<number>();
  for (const raw of rangeInputs) {
    const parsed = parsePageSelectionExpression(raw, totalPages);
    if (parsed.ok) {
      for (const p of parsed.pages) {
        covered.add(p);
      }
    }
  }

  const missingRanges: string[] = [];
  let start: number | null = null;
  for (let p = 1; p <= totalPages; p += 1) {
    if (!covered.has(p)) {
      if (start === null) start = p;
    } else if (start !== null) {
      missingRanges.push(start === p - 1 ? `${start}` : `${start}-${p - 1}`);
      start = null;
    }
  }
  if (start !== null) {
    missingRanges.push(
      start === totalPages ? `${start}` : `${start}-${totalPages}`
    );
  }
  return missingRanges;
}

function formatPagesAsCompactExpression(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const tokens: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (current === end + 1) {
      end = current;
    } else {
      tokens.push(start === end ? `${start}` : `${start}-${end}`);
      start = current;
      end = current;
    }
  }
  tokens.push(start === end ? `${start}` : `${start}-${end}`);
  return tokens.join(", ");
}

function triggerBrowserDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function PdfSplitter() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const activeCancelRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<number>(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<PdfSplitInspection | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("ranges");
  const [rangeRows, setRangeRows] = useState<RangeRow[]>([
    { id: "initial-1", value: "" },
  ]);
  const [extractExpression, setExtractExpression] = useState<string>("");
  const [pageGridWindowIndex, setPageGridWindowIndex] = useState<number>(0);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [progress, setProgress] = useState<SplitProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultState, setResultState] = useState<SplitResultState | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  const revokeAllObjectUrls = () => {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      activeCancelRef.current?.();
      activeCancelRef.current = null;
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      objectUrlsRef.current = [];
    };
  }, []);

  const clearResults = () => {
    revokeAllObjectUrls();
    setResultState(null);
  };

  const handleSelectFile = async (file: File) => {
    const metaError = validateSplitFileMetadata(file);
    if (metaError) {
      setErrorMessage(metaError);
      return;
    }

    sessionIdRef.current += 1;
    const currentSession = sessionIdRef.current;

    activeCancelRef.current?.();
    activeCancelRef.current = null;
    clearResults();
    setIsSplitting(false);
    setProgress(null);
    setErrorMessage(null);
    setIsInspecting(true);

    try {
      const info = await inspectSplitPdfFileInBrowser(file);
      if (sessionIdRef.current !== currentSession) {
        return;
      }

      setSelectedFile(file);
      setInspection(info);
      setRangeRows(buildInitialRanges(info.pageCount));
      setPageGridWindowIndex(0);
      if (info.pageCount === 1) {
        setSplitMode("extract");
        setExtractExpression("1");
      } else {
        setSplitMode("ranges");
        setExtractExpression("");
      }
      setAnnouncement(
        `Loaded ${file.name}, ${info.pageCount} ${info.pageCount === 1 ? "page" : "pages"}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      setErrorMessage(translateSplitPdfError(error));
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsInspecting(false);
      }
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleSelectFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isInspecting || isSplitting) return;
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setErrorMessage("Please select one PDF document at a time.");
      return;
    }
    void handleSelectFile(files[0]);
  };

  const handleReset = () => {
    sessionIdRef.current += 1;
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    clearResults();
    setSelectedFile(null);
    setInspection(null);
    setRangeRows([{ id: createRowId(), value: "" }]);
    setExtractExpression("");
    setPageGridWindowIndex(0);
    setSplitMode("ranges");
    setIsInspecting(false);
    setIsSplitting(false);
    setProgress(null);
    setErrorMessage(null);
    setAnnouncement("Cleared selected PDF.");
  };

  const handleCancelSplit = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    setIsSplitting(false);
    setProgress(null);
    setAnnouncement("PDF split cancelled.");
  };

  const handleModeChange = (nextMode: SplitMode) => {
    if (isSplitting || nextMode === splitMode) return;
    clearResults();
    setErrorMessage(null);
    setSplitMode(nextMode);
  };

  const handleRangeChange = (id: string, value: string) => {
    clearResults();
    setErrorMessage(null);
    setRangeRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row))
    );
  };

  const handleRangePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted || (!pasted.includes("\n") && !pasted.includes(";"))) {
      return;
    }

    const lines = pasted
      .split(/[\r\n;]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) return;

    event.preventDefault();
    clearResults();
    setErrorMessage(null);
    setRangeRows((prev) => {
      const before = prev.slice(0, index);
      const after = prev.slice(index + 1);
      const inserted: RangeRow[] = lines.map((line, offset) => ({
        id: offset === 0 && prev[index] ? prev[index].id : createRowId(),
        value: line,
      }));
      return [...before, ...inserted, ...after].slice(0, MAX_SPLIT_RANGES);
    });
  };

  const handleAddRange = () => {
    if (isSplitting || rangeRows.length >= MAX_SPLIT_RANGES) return;
    clearResults();
    setErrorMessage(null);

    let suggestedValue = "";
    if (inspection) {
      const missing = computeUncoveredRangeStrings(
        rangeRows.map((r) => r.value),
        inspection.pageCount
      );
      if (missing.length > 0) {
        suggestedValue = missing[0];
      }
    }

    setRangeRows((prev) => [
      ...prev,
      { id: createRowId(), value: suggestedValue },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (isSplitting || rangeRows.length <= 1) return;
    clearResults();
    setErrorMessage(null);
    setRangeRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleIncludeRemainingRanges = () => {
    if (!inspection || isSplitting) return;
    const missing = computeUncoveredRangeStrings(
      rangeRows.map((r) => r.value),
      inspection.pageCount
    );
    if (missing.length === 0) return;

    clearResults();
    setErrorMessage(null);
    setRangeRows((prev) => {
      const next = [...prev];
      for (const rangeStr of missing) {
        if (next.length >= MAX_SPLIT_RANGES) break;
        next.push({ id: createRowId(), value: rangeStr });
      }
      return next;
    });
  };

  // Visual Page Grid state for Extract mode (two-way synced with extractExpression)
  const parsedExtractSelection = useMemo(() => {
    if (!inspection) return new Set<number>();
    const parsed = parsePageSelectionExpression(
      extractExpression,
      inspection.pageCount
    );
    return parsed.ok ? new Set(parsed.pages) : new Set<number>();
  }, [extractExpression, inspection]);

  const handleTogglePageTile = (pageNum: number) => {
    if (!inspection || isSplitting) return;
    clearResults();
    setErrorMessage(null);
    const next = new Set(parsedExtractSelection);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    const expr = formatPagesAsCompactExpression(Array.from(next));
    setExtractExpression(expr);
  };

  const handleQuickExtractPreset = (preset: "all" | "odd" | "even" | "clear") => {
    if (!inspection || isSplitting) return;
    clearResults();
    setErrorMessage(null);
    if (preset === "clear") {
      setExtractExpression("");
      return;
    }
    if (preset === "all") {
      setExtractExpression(
        inspection.pageCount === 1 ? "1" : `1-${inspection.pageCount}`
      );
      return;
    }
    const pages: number[] = [];
    for (let p = 1; p <= inspection.pageCount; p += 1) {
      if (preset === "odd" && p % 2 === 1) pages.push(p);
      if (preset === "even" && p % 2 === 0) pages.push(p);
    }
    setExtractExpression(formatPagesAsCompactExpression(pages));
  };

  // Range coverage map for visual range overview
  const rangeCoverageByPage = useMemo(() => {
    if (!inspection || splitMode !== "ranges") return null;
    const owner = new Map<number, number>();
    rangeRows.forEach((row, idx) => {
      const parsed = parsePageSelectionExpression(
        row.value,
        inspection.pageCount
      );
      if (parsed.ok) {
        for (const p of parsed.pages) {
          if (!owner.has(p)) {
            owner.set(p, idx + 1);
          }
        }
      }
    });
    return owner;
  }, [inspection, splitMode, rangeRows]);

  // Real-time plan validation for the active mode
  const planPreview = useMemo(() => {
    if (!selectedFile || !inspection) {
      return null;
    }

    if (splitMode === "ranges") {
      const result = buildSplitByRangesPlan(
        rangeRows.map((r) => r.value),
        inspection.pageCount,
        selectedFile.name
      );
      if (!result.ok) {
        return {
          mode: "ranges" as const,
          ok: false as const,
          error: result.error,
          errorRangeIndex: result.rangeIndex,
          plans: [] as SplitOutputPlan[],
          uncoveredPageCount: 0,
        };
      }
      return {
        mode: "ranges" as const,
        ok: true as const,
        plans: result.plans,
        coveredPageCount: result.coveredPageCount,
        uncoveredPageCount: result.uncoveredPageCount,
      };
    }

    if (splitMode === "extract") {
      const result = buildExtractPagesPlan(
        extractExpression,
        inspection.pageCount,
        selectedFile.name
      );
      if (!result.ok) {
        return {
          mode: "extract" as const,
          ok: false as const,
          error: result.error,
          plans: [] as SplitOutputPlan[],
        };
      }
      return {
        mode: "extract" as const,
        ok: true as const,
        plans: [result.plan],
      };
    }

    const everyResult = buildEveryPageSplitPlan(
      inspection.pageCount,
      selectedFile.name
    );
    if (!everyResult.ok) {
      return {
        mode: "every-page" as const,
        ok: false as const,
        error: everyResult.error,
        plans: [] as SplitOutputPlan[],
      };
    }
    return {
      mode: "every-page" as const,
      ok: true as const,
      plans: everyResult.plans,
    };
  }, [selectedFile, inspection, splitMode, rangeRows, extractExpression]);

  const handleSplitSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!selectedFile || !inspection || isInspecting || isSplitting) {
      return;
    }
    if (!planPreview || !planPreview.ok) {
      setErrorMessage(
        planPreview?.error ?? "Select or enter valid pages to continue."
      );
      return;
    }

    const currentSession = sessionIdRef.current;
    clearResults();
    setErrorMessage(null);
    setIsSplitting(true);
    setProgress({
      stage: "reading",
      percent: null,
      detail: "Reading source PDF",
    });

    const job = splitPdfFileInBrowser(
      selectedFile,
      planPreview.plans,
      selectedFile.name,
      (p) => {
        if (sessionIdRef.current === currentSession) {
          setProgress(p);
        }
      }
    );

    activeCancelRef.current = job.cancel;

    try {
      const result = await job.promise;
      if (sessionIdRef.current !== currentSession) {
        return;
      }

      activeCancelRef.current = null;
      revokeAllObjectUrls();

      const newUrls: string[] = [];
      const outputItems: OutputDownloadItem[] = result.outputs.map((out) => {
        const copy = new Uint8Array(out.bytes.byteLength);
        copy.set(out.bytes);
        const blob = new Blob([copy], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        newUrls.push(url);
        return {
          id: out.id,
          filename: out.filename,
          rangeLabel: out.rangeLabel,
          pageCount: out.pageCount,
          sizeBytes: out.sizeBytes,
          url,
        };
      });

      let zipUrl: string | null = null;
      let zipSizeBytes: number | null = null;
      if (result.zipBytes && result.zipFilename) {
        const zipCopy = new Uint8Array(result.zipBytes.byteLength);
        zipCopy.set(result.zipBytes);
        const zipBlob = new Blob([zipCopy], { type: "application/zip" });
        zipUrl = URL.createObjectURL(zipBlob);
        zipSizeBytes = result.zipBytes.byteLength;
        newUrls.push(zipUrl);
      }

      objectUrlsRef.current = newUrls;

      setResultState({
        outputs: outputItems,
        zipUrl,
        zipFilename: result.zipFilename,
        zipSizeBytes,
        sourcePageCount: result.sourcePageCount,
        hasDigitalSignature: result.hasDigitalSignature,
        hasFormFields: result.hasFormFields,
        hasLinks: result.hasLinks,
        hasOutlines: result.hasOutlines,
      });

      setAnnouncement(
        `Split complete. Created ${outputItems.length} ${outputItems.length === 1 ? "PDF file" : "PDF files"}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      activeCancelRef.current = null;

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("cancelled")
      ) {
        return;
      }

      setErrorMessage(translateSplitPdfError(error));
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsSplitting(false);
        setProgress(null);
      }
    }
  };

  const maxMb = Math.round(MAX_SPLIT_PDF_BYTES / (1024 * 1024));
  const stem = selectedFile ? cleanPdfStem(selectedFile.name) : "document";

  const showExtractError =
    splitMode === "extract" &&
    extractExpression.trim().length > 0 &&
    planPreview?.ok === false;

  const hasEmptyRangeRow =
    splitMode === "ranges" &&
    rangeRows.some((r) => r.value.trim().length === 0);

  const hasNonEmptyRangeInput =
    splitMode === "ranges" &&
    rangeRows.some((r) => r.value.trim().length > 0);

  const isErrorFromEmptyRow =
    splitMode === "ranges" &&
    planPreview?.ok === false &&
    planPreview.errorRangeIndex !== undefined &&
    rangeRows[planPreview.errorRangeIndex]?.value.trim().length === 0;

  const showRangesError =
    splitMode === "ranges" &&
    planPreview?.ok === false &&
    hasNonEmptyRangeInput &&
    !isErrorFromEmptyRow;

  const canStartSplit =
    Boolean(selectedFile) &&
    Boolean(inspection) &&
    Boolean(planPreview?.ok) &&
    !isInspecting &&
    !isSplitting;

  // Pagination calculations for the visual Page Picker Grid
  const totalGridWindows = inspection
    ? Math.ceil(inspection.pageCount / PAGE_GRID_WINDOW)
    : 1;
  const safeWindowIndex = Math.min(pageGridWindowIndex, totalGridWindows - 1);
  const windowStartPage = safeWindowIndex * PAGE_GRID_WINDOW + 1;
  const windowEndPage = inspection
    ? Math.min(inspection.pageCount, windowStartPage + PAGE_GRID_WINDOW - 1)
    : 0;
  const visiblePageNumbers = useMemo(() => {
    if (!inspection) return [];
    const list: number[] = [];
    for (let p = windowStartPage; p <= windowEndPage; p += 1) {
      list.push(p);
    }
    return list;
  }, [inspection, windowStartPage, windowEndPage]);

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <input
        ref={fileInputRef}
        id="pdf-splitter-file-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileInputChange}
        className="sr-only"
      />

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      <ToolErrorBanner
        messages={errorMessage ? [errorMessage] : []}
        onDismiss={() => setErrorMessage(null)}
      />

      {!selectedFile || !inspection ? (
        <ToolUploadDropzone
          icon={<PdfDocumentIcon className="h-6 w-6" />}
          buttonLabel="Select PDF file"
          busyLabel="Reading PDF..."
          isBusy={isInspecting}
          isDragging={isDragging}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          onButtonClick={() => fileInputRef.current?.click()}
          helperText="or drop a PDF document here"
          supportText={`Extract individual pages or divide into sections · up to ${maxMb} MB`}
        />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isSplitting && !isInspecting) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={`space-y-5 rounded-2xl transition-colors ${
            isDragging ? "ring-2 ring-[#5C7E8F]/40" : ""
          }`}
        >
          {/* Selected PDF Summary Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579]">
                <PdfDocumentIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  title={selectedFile.name}
                  className="truncate text-sm font-semibold text-[#20272B]"
                >
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                  {inspection.pageCount}{" "}
                  {inspection.pageCount === 1 ? "page" : "pages"} ·{" "}
                  {formatPdfBytes(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isInspecting || isSplitting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
              >
                {isInspecting ? "Loading..." : "Replace PDF"}
              </button>
              <button
                type="button"
                disabled={isSplitting}
                onClick={handleReset}
                className="min-h-[42px] rounded-xl px-3 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
              >
                Start over
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
            {/* Left / Main Column: Mode & Visual Page Selection */}
            <form
              onSubmit={handleSplitSubmit}
              className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-7"
            >
              {/* Mode Cards */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-[#20272B]">
                  Choose how to split
                </span>
                <div
                  role="group"
                  aria-label="Choose how to split this PDF"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  {(
                    [
                      {
                        id: "ranges",
                        label: "Split by ranges",
                        hint: "Divide into parts (1-5, 6-10)",
                      },
                      {
                        id: "extract",
                        label: "Pick pages",
                        hint: "Select exact pages into 1 PDF",
                      },
                      {
                        id: "every-page",
                        label: "Every page",
                        hint: "Save each page separately",
                      },
                    ] as const
                  ).map((option) => {
                    const active = splitMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isSplitting}
                        aria-pressed={active}
                        onClick={() => handleModeChange(option.id)}
                        className={`flex min-h-[72px] flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] disabled:opacity-60 ${
                          active
                            ? "border-[#426579] bg-[#F3F6F7] shadow-[inset_0_0_0_1px_#426579]"
                            : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#20272B]">
                            {option.label}
                          </span>
                          {active ? (
                            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#426579] text-white">
                              <CheckIcon className="h-2.5 w-2.5" />
                            </span>
                          ) : null}
                        </div>
                        <span className="mt-1 text-[11px] leading-snug text-[#556168]">
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {inspection.pageCount === 1 ? (
                  <p className="rounded-xl bg-[#F3F6F7] px-3.5 py-2.5 text-xs text-[#466677]">
                    This PDF has 1 page. You can save a clean copy with Pick
                    pages or Every page.
                  </p>
                ) : null}
              </div>

              {/* Mode A: Split by Page Ranges */}
              {splitMode === "ranges" ? (
                <div className="space-y-4 border-t border-[#D4DDE2]/80 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#556168]">
                      Each part creates its own PDF file (for example{" "}
                      <span className="font-mono text-[#20272B]">1-5</span>).
                    </p>
                    <button
                      type="button"
                      disabled={
                        isSplitting || rangeRows.length >= MAX_SPLIT_RANGES
                      }
                      onClick={handleAddRange}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      <PlusIcon className="h-3.5 w-3.5 text-[#466677]" />
                      <span>Add part</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {rangeRows.map((row, idx) => {
                      const rowParsed = parsePageSelectionExpression(
                        row.value,
                        inspection.pageCount
                      );
                      const isRowErrorTarget =
                        showRangesError &&
                        planPreview &&
                        !planPreview.ok &&
                        planPreview.errorRangeIndex === idx;

                      return (
                        <div
                          key={row.id}
                          className="flex items-center gap-2 sm:gap-2.5"
                        >
                          <label
                            htmlFor={`split-range-${row.id}`}
                            className="w-14 shrink-0 font-mono text-xs font-medium text-[#466677] tabular-nums sm:w-16"
                          >
                            Part {idx + 1}
                          </label>

                          <div className="relative min-w-0 flex-1">
                            <input
                              id={`split-range-${row.id}`}
                              type="text"
                              value={row.value}
                              disabled={isSplitting}
                              onPaste={(e) => handleRangePaste(idx, e)}
                              onChange={(e) =>
                                handleRangeChange(row.id, e.target.value)
                              }
                              placeholder={
                                idx === 0
                                  ? inspection.pageCount === 1
                                    ? "1"
                                    : `1-${Math.min(5, inspection.pageCount)}`
                                  : "e.g. 6-10"
                              }
                              aria-invalid={isRowErrorTarget || undefined}
                              className={`min-h-[44px] w-full rounded-xl border bg-white px-3.5 py-2 pr-16 font-mono text-sm text-[#20272B] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F3F6F7] sm:pr-20 ${
                                isRowErrorTarget
                                  ? "border-[#B44A4A] focus:border-[#B44A4A] focus:ring-[#B44A4A]/25"
                                  : "border-[#D4DDE2] focus:border-[#5C7E8F] focus:ring-[#5C7E8F]/30"
                              }`}
                            />
                            {rowParsed.ok ? (
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#466677] tabular-nums">
                                {rowParsed.pages.length}{" "}
                                {rowParsed.pages.length === 1 ? "pg" : "pgs"}
                              </span>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            disabled={rangeRows.length <= 1 || isSplitting}
                            onClick={() => handleRemoveRange(row.id)}
                            aria-label={`Remove part ${idx + 1}`}
                            title="Remove part"
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#556168] transition-colors hover:bg-[#FDF5F5] hover:text-[#7A2727] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:h-10 sm:w-10"
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Page Coverage Strip for quick human verification */}
                  {inspection.pageCount <= 60 && rangeCoverageByPage ? (
                    <div className="space-y-1.5 rounded-xl bg-[#F3F6F7]/75 p-3">
                      <div className="flex items-center justify-between text-[11px] text-[#556168]">
                        <span>Page map</span>
                        <span>
                          {rangeCoverageByPage.size} of {inspection.pageCount}{" "}
                          pages assigned
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          { length: inspection.pageCount },
                          (_, i) => i + 1
                        ).map((pageNum) => {
                          const partNum = rangeCoverageByPage.get(pageNum);
                          return (
                            <span
                              key={pageNum}
                              title={
                                partNum
                                  ? `Page ${pageNum} → Part ${partNum}`
                                  : `Page ${pageNum} (omitted)`
                              }
                              className={`inline-flex h-6 min-w-[26px] items-center justify-center rounded-md border px-1 font-mono text-[11px] tabular-nums ${
                                partNum
                                  ? "border-[#426579]/35 bg-white font-medium text-[#20272B]"
                                  : "border-dashed border-[#D4DDE2] bg-transparent text-[#556168]/75"
                              }`}
                            >
                              {pageNum}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {showRangesError && planPreview && !planPreview.ok ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-[#B44A4A]/35 bg-[#FDF5F5] px-3.5 py-2.5 text-xs text-[#7A2727]"
                    >
                      {planPreview.error}
                    </p>
                  ) : hasEmptyRangeRow && hasNonEmptyRangeInput ? (
                    <p className="text-xs text-[#556168]">
                      Enter pages for every part or remove empty rows to
                      continue.
                    </p>
                  ) : null}

                  {planPreview?.ok &&
                  planPreview.mode === "ranges" &&
                  planPreview.uncoveredPageCount > 0 ? (
                    <div className="flex flex-col gap-2.5 rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs text-[#5D3D1A] sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        {planPreview.uncoveredPageCount} of{" "}
                        {inspection.pageCount}{" "}
                        {inspection.pageCount === 1 ? "page is" : "pages are"}{" "}
                        not included and will be skipped.
                      </p>
                      <button
                        type="button"
                        disabled={
                          isSplitting || rangeRows.length >= MAX_SPLIT_RANGES
                        }
                        onClick={handleIncludeRemainingRanges}
                        className="inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-lg border border-[#B47A3C]/40 bg-white px-2.5 py-1 text-xs font-medium text-[#5D3D1A] transition-colors hover:bg-[#FDF9F3] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Add remaining pages
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Mode B: Visual Page Picker + Synced Expression */}
              {splitMode === "extract" ? (
                <div className="space-y-4 border-t border-[#D4DDE2]/80 pt-5">
                  {/* Visual Page Selection Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#20272B]">
                      Click pages to include ({parsedExtractSelection.size} of{" "}
                      {inspection.pageCount} selected)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={isSplitting}
                        onClick={() => handleQuickExtractPreset("all")}
                        className="min-h-[34px] rounded-lg bg-[#F3F6F7] px-2.5 py-1 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#D4DDE2]/70 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Select all
                      </button>
                      {inspection.pageCount > 1 ? (
                        <>
                          <button
                            type="button"
                            disabled={isSplitting}
                            onClick={() => handleQuickExtractPreset("odd")}
                            className="min-h-[34px] rounded-lg bg-[#F3F6F7] px-2.5 py-1 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#D4DDE2]/70 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            Odd
                          </button>
                          <button
                            type="button"
                            disabled={isSplitting}
                            onClick={() => handleQuickExtractPreset("even")}
                            className="min-h-[34px] rounded-lg bg-[#F3F6F7] px-2.5 py-1 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#D4DDE2]/70 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            Even
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        disabled={
                          isSplitting || parsedExtractSelection.size === 0
                        }
                        onClick={() => handleQuickExtractPreset("clear")}
                        className="min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Interactive Page Tile Grid */}
                  <div className="space-y-2.5 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/55 p-3">
                    <div
                      role="group"
                      aria-label="Selectable PDF pages"
                      className="grid max-h-[260px] grid-cols-4 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-6"
                    >
                      {visiblePageNumbers.map((pageNum) => {
                        const isSelected = parsedExtractSelection.has(pageNum);
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            disabled={isSplitting}
                            aria-pressed={isSelected}
                            aria-label={`Page ${pageNum}`}
                            onClick={() => handleTogglePageTile(pageNum)}
                            className={`relative flex min-h-[56px] flex-col items-center justify-center rounded-lg border p-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                              isSelected
                                ? "border-[#426579] bg-white text-[#20272B] shadow-[inset_0_0_0_1px_#426579]"
                                : "border-[#D4DDE2] bg-white/80 text-[#556168] hover:border-[#5C7E8F] hover:bg-white hover:text-[#20272B]"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`mb-1 inline-flex h-4 w-4 items-center justify-center rounded ${
                                isSelected
                                  ? "bg-[#426579] text-white"
                                  : "border border-[#D4DDE2] bg-[#F3F6F7]"
                              }`}
                            >
                              {isSelected ? (
                                <CheckIcon className="h-2.5 w-2.5" />
                              ) : null}
                            </span>
                            <span className="font-mono text-xs font-medium tabular-nums">
                              Pg {pageNum}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {totalGridWindows > 1 ? (
                      <div className="flex items-center justify-between gap-2 border-t border-[#D4DDE2] pt-2.5 text-xs">
                        <span className="font-mono text-[#556168] tabular-nums">
                          Showing pages {windowStartPage}–{windowEndPage} of{" "}
                          {inspection.pageCount}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={safeWindowIndex === 0}
                            onClick={() =>
                              setPageGridWindowIndex((prev) =>
                                Math.max(0, prev - 1)
                              )
                            }
                            className="min-h-[34px] rounded-lg border border-[#D4DDE2] bg-white px-2.5 py-1 text-xs font-medium text-[#20272B] hover:border-[#5C7E8F] disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={safeWindowIndex >= totalGridWindows - 1}
                            onClick={() =>
                              setPageGridWindowIndex((prev) =>
                                Math.min(totalGridWindows - 1, prev + 1)
                              )
                            }
                            className="min-h-[34px] rounded-lg border border-[#D4DDE2] bg-white px-2.5 py-1 text-xs font-medium text-[#20272B] hover:border-[#5C7E8F] disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Two-way Synced Custom Input */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="extract-pages-input"
                      className="block text-xs font-medium text-[#556168]"
                    >
                      Or type pages / ranges (saved in the exact order entered)
                    </label>
                    <input
                      id="extract-pages-input"
                      type="text"
                      value={extractExpression}
                      disabled={isSplitting}
                      onChange={(e) => {
                        clearResults();
                        setErrorMessage(null);
                        setExtractExpression(e.target.value);
                      }}
                      placeholder="e.g. 1, 3, 5-8, 12"
                      aria-invalid={showExtractError || undefined}
                      className={`min-h-[44px] w-full rounded-xl border bg-white px-3.5 py-2 font-mono text-sm text-[#20272B] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F3F6F7] ${
                        showExtractError
                          ? "border-[#B44A4A] focus:border-[#B44A4A] focus:ring-[#B44A4A]/25"
                          : "border-[#D4DDE2] focus:border-[#5C7E8F] focus:ring-[#5C7E8F]/30"
                      }`}
                    />
                  </div>

                  {showExtractError && planPreview && !planPreview.ok ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-[#B44A4A]/35 bg-[#FDF5F5] px-3.5 py-2.5 text-xs text-[#7A2727]"
                    >
                      {planPreview.error}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Mode C: Split Every Page */}
              {splitMode === "every-page" ? (
                <div className="space-y-2.5 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/65 p-4">
                  {planPreview?.ok && planPreview.mode === "every-page" ? (
                    <>
                      <p className="text-sm font-medium text-[#20272B] tabular-nums">
                        Creates {planPreview.plans.length} separate PDF{" "}
                        {planPreview.plans.length === 1 ? "file" : "files"}
                      </p>
                      <p className="font-mono text-xs text-[#556168]">
                        {stem}-01.pdf
                        {planPreview.plans.length > 1
                          ? ` … ${stem}-${padPageNumber(
                              inspection.pageCount,
                              inspection.pageCount
                            )}.pdf`
                          : ""}
                      </p>
                      <p className="text-xs text-[#556168]">
                        {planPreview.plans.length > 1
                          ? "Download everything together as one ZIP archive or save individual pages."
                          : "Ready to save as a single-page PDF."}
                      </p>
                    </>
                  ) : planPreview && !planPreview.ok ? (
                    <p role="alert" className="text-xs text-[#7A2727]">
                      {planPreview.error}
                    </p>
                  ) : (
                    <p className="text-xs text-[#556168]">
                      Up to {MAX_EVERY_PAGE_OUTPUTS} individual page files can
                      be created at once.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Document Compatibility Notices */}
              {inspection.hasDigitalSignature ? (
                <p className="rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                  This PDF contains a digital signature. Splitting creates new
                  documents and invalidates cryptographic signatures.
                </p>
              ) : null}

              {inspection.hasFormFields ||
              inspection.hasOutlines ||
              inspection.hasLinks ? (
                <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 px-3.5 py-2.5 text-xs leading-relaxed text-[#556168]">
                  Interactive form fields, bookmarks, or cross-page links in
                  this PDF may not carry over identically to split files.
                </p>
              ) : null}

              {isSplitting && progress ? (
                <ToolProgressCard
                  stageLabel={STAGE_LABELS[progress.stage]}
                  detail={progress.detail}
                  percent={progress.percent}
                  onCancel={handleCancelSplit}
                />
              ) : null}

              {/* Action Bar */}
              <div className="flex flex-col gap-2.5 border-t border-[#D4DDE2]/80 pt-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canStartSplit}
                  className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                >
                  {isSplitting
                    ? "Splitting PDF..."
                    : splitMode === "extract"
                      ? "Create extracted PDF"
                      : "Split PDF"}
                </button>
              </div>
            </form>

            {/* Right Column: Live Output Preview OR Ready Downloads */}
            <aside
              aria-label="Output plan and downloads"
              className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-5"
            >
              {resultState && !isSplitting ? (
                <div aria-live="polite" className="space-y-4">
                  <ToolResultHeader
                    title="Your split files are ready"
                    rightContent={
                      <span className="font-mono text-xs text-[#556168] tabular-nums">
                        {resultState.outputs.length}{" "}
                        {resultState.outputs.length === 1 ? "file" : "files"}
                      </span>
                    }
                  />

                  <div className="space-y-2.5">
                    {resultState.outputs.length > 1 &&
                    resultState.zipUrl &&
                    resultState.zipFilename ? (
                      <button
                        type="button"
                        onClick={() =>
                          triggerBrowserDownload(
                            resultState.zipUrl!,
                            resultState.zipFilename!
                          )
                        }
                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        <span>
                          Download all as ZIP
                          {resultState.zipSizeBytes
                            ? ` (${formatPdfBytes(resultState.zipSizeBytes)})`
                            : ""}
                        </span>
                      </button>
                    ) : resultState.outputs[0] ? (
                      <button
                        type="button"
                        onClick={() =>
                          triggerBrowserDownload(
                            resultState.outputs[0].url,
                            resultState.outputs[0].filename
                          )
                        }
                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[42px] w-full rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Split another PDF
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-[#D4DDE2] pt-4">
                    <p className="text-xs font-medium text-[#466677]">
                      Individual files
                    </p>
                    <ul className="max-h-[340px] divide-y divide-[#D4DDE2] overflow-y-auto rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/40">
                      {resultState.outputs.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 bg-white/85 px-3.5 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              title={item.filename}
                              className="truncate font-mono text-xs font-medium text-[#20272B]"
                            >
                              {item.filename}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                              {item.rangeLabel} ·{" "}
                              {formatPdfBytes(item.sizeBytes)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              triggerBrowserDownload(item.url, item.filename)
                            }
                            aria-label={`Download ${item.filename}`}
                            className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#426579] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            <DownloadIcon className="h-3.5 w-3.5" />
                            <span>Save</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#20272B]">
                      What will be created
                    </h2>
                    {planPreview?.ok ? (
                      <span className="font-mono text-xs text-[#426579] tabular-nums">
                        {planPreview.plans.length}{" "}
                        {planPreview.plans.length === 1 ? "PDF" : "PDFs"}
                      </span>
                    ) : null}
                  </div>

                  {planPreview?.ok ? (
                    <>
                      <ul className="max-h-[320px] divide-y divide-[#D4DDE2] overflow-y-auto rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/40">
                        {planPreview.plans.slice(0, 50).map((plan) => (
                          <li
                            key={plan.id}
                            className="flex items-center justify-between gap-3 bg-white/85 px-3.5 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                title={plan.filename}
                                className="truncate font-mono text-xs font-medium text-[#20272B]"
                              >
                                {plan.filename}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#556168]">
                                {plan.rangeLabel}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs text-[#466677] tabular-nums">
                              {plan.pages.length}{" "}
                              {plan.pages.length === 1 ? "pg" : "pgs"}
                            </span>
                          </li>
                        ))}
                        {planPreview.plans.length > 50 ? (
                          <li className="px-3.5 py-2.5 text-center font-mono text-xs text-[#466677] tabular-nums">
                            + {planPreview.plans.length - 50} more files
                          </li>
                        ) : null}
                      </ul>

                      {planPreview.plans.length > 1 ? (
                        <p className="text-xs text-[#556168]">
                          Multiple files will be packaged into a convenient ZIP
                          download, with individual file buttons too.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#D4DDE2] bg-[#F3F6F7]/40 px-4 py-8 text-center text-xs leading-relaxed text-[#556168]">
                      {splitMode === "extract"
                        ? "Click page tiles on the left or type page numbers to see the PDF that will be created."
                        : "Enter valid page ranges on the left to preview your output PDF files."}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      <ToolPrivacyNote text="Your PDF stays on your device and is split locally in your browser." />
    </div>
  );
}

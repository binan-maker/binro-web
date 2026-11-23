"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type SVGProps,
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

function PdfDocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5L14 3.5Z" />
      <path d="M14 3.5v5h4.5" />
      <path d="M9 13h6" />
      <path d="M9 16.5h4" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.75" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 3.5v9.5" />
      <path d="m6.5 9.5 3.5 3.5 3.5-3.5" />
      <path d="M4 15.5h12" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 4.5v11" />
      <path d="M4.5 10h11" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m5.5 5.5 9 9" />
      <path d="m14.5 5.5-9 9" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m5 10.5 3.5 3.5 6.5-7.5" />
    </svg>
  );
}

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
      setExtractExpression("");
      if (info.pageCount === 1) {
        setSplitMode("extract");
        setExtractExpression("1");
      } else {
        setSplitMode("ranges");
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
      setErrorMessage(
        "Please select one PDF document at a time."
      );
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
    if (
      !selectedFile ||
      !inspection ||
      !planPreview ||
      !planPreview.ok ||
      isInspecting ||
      isSplitting
    ) {
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

      {errorMessage ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-4 py-3 text-sm text-[#7A2727] sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3 py-1 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!selectedFile || !inspection ? (
        /* Clean Single-PDF Upload Dropzone */
        <div
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
          className="rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6"
        >
          <div
            className={`flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition-colors duration-150 sm:min-h-[320px] ${
              isDragging
                ? "border-[#426579] bg-[#F3F6F7]"
                : "border-[#D4DDE2] bg-[#F3F6F7]/50 hover:border-[#5C7E8F]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#5C7E8F]">
              <PdfDocumentIcon className="h-6 w-6" />
            </div>

            <button
              type="button"
              disabled={isInspecting}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isInspecting ? "Reading PDF..." : "Select PDF file"}
            </button>

            <p className="mt-3 text-sm text-[#556168]">
              or drop a PDF document here
            </p>
            <p className="mt-4 text-xs text-[#5C7E8F]">
              Single PDF · up to {maxMb} MB
            </p>
          </div>
        </div>
      ) : (
        /* Split Workspace */
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579]">
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
                  {formatPdfBytes(selectedFile.size)} · {inspection.pageCount}{" "}
                  {inspection.pageCount === 1 ? "page" : "pages"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isInspecting || isSplitting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#20272B] whitespace-nowrap transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                {isInspecting ? "Loading..." : "Replace PDF"}
              </button>
              <button
                type="button"
                disabled={isSplitting}
                onClick={handleReset}
                className="min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-medium text-[#556168] whitespace-nowrap transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start lg:gap-8">
            {/* Left / Main Column: Split Mode & Configuration */}
            <form
              onSubmit={handleSplitSubmit}
              className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-7"
            >
              {/* Mode Selector */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-[#5C7E8F]">
                  Split mode
                </span>
                <div
                  role="group"
                  aria-label="Choose how to split this PDF"
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                >
                  {(
                    [
                      { id: "ranges", label: "Split by page ranges" },
                      { id: "extract", label: "Extract selected pages" },
                      { id: "every-page", label: "Split every page" },
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
                        className={`relative flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-center text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] disabled:opacity-60 ${
                          active
                            ? "border-[#426579] bg-[#F3F6F7] text-[#20272B] shadow-[inset_0_0_0_1px_#426579]"
                            : "border-[#D4DDE2] bg-white text-[#556168] hover:border-[#5C7E8F] hover:text-[#20272B]"
                        }`}
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="mr-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1CC8A0]"
                          />
                        ) : null}
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode A: Split by Page Ranges */}
              {splitMode === "ranges" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#556168]">
                      Each range creates a separate PDF file (for example{" "}
                      <span className="font-mono text-[#20272B]">1-5</span>).
                    </p>
                    <button
                      type="button"
                      disabled={
                        isSplitting || rangeRows.length >= MAX_SPLIT_RANGES
                      }
                      onClick={handleAddRange}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      <PlusIcon className="h-3.5 w-3.5 text-[#5C7E8F]" />
                      <span>Add range</span>
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
                            className="w-14 shrink-0 font-mono text-xs font-medium text-[#5C7E8F] tabular-nums sm:w-16"
                          >
                            Range {idx + 1}
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
                                  ? `1-${Math.min(5, inspection.pageCount)}`
                                  : "e.g. 6-10"
                              }
                              aria-invalid={isRowErrorTarget || undefined}
                              className={`min-h-[42px] w-full rounded-xl border bg-white px-3 py-2 pr-14 font-mono text-sm text-[#20272B] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F3F6F7] sm:pr-20 ${
                                isRowErrorTarget
                                  ? "border-[#B44A4A] focus:border-[#B44A4A] focus:ring-[#B44A4A]/25"
                                  : "border-[#D4DDE2] focus:border-[#5C7E8F] focus:ring-[#5C7E8F]/30"
                              }`}
                            />
                            {rowParsed.ok ? (
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#5C7E8F] tabular-nums sm:right-3">
                                {rowParsed.pages.length}{" "}
                                {rowParsed.pages.length === 1 ? "pg" : "pgs"}
                              </span>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            disabled={rangeRows.length <= 1 || isSplitting}
                            onClick={() => handleRemoveRange(row.id)}
                            aria-label={`Remove range ${idx + 1}`}
                            title="Remove range"
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#556168] transition-colors hover:bg-[#FDF5F5] hover:text-[#7A2727] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {showRangesError && planPreview && !planPreview.ok ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-[#B44A4A]/35 bg-[#FDF5F5] px-3.5 py-2.5 text-xs text-[#7A2727]"
                    >
                      {planPreview.error}
                    </p>
                  ) : hasEmptyRangeRow && hasNonEmptyRangeInput ? (
                    <p className="text-xs text-[#556168]">
                      Enter pages for every range row or remove empty rows to
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
                        not included in your ranges and will be omitted.
                      </p>
                      <button
                        type="button"
                        disabled={
                          isSplitting || rangeRows.length >= MAX_SPLIT_RANGES
                        }
                        onClick={handleIncludeRemainingRanges}
                        className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-lg border border-[#B47A3C]/40 bg-white px-2.5 py-1 text-xs font-medium text-[#5D3D1A] transition-colors hover:bg-[#FDF9F3] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Add remaining pages
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Mode B: Extract Selected Pages */}
              {splitMode === "extract" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="extract-pages-input"
                      className="block text-xs font-medium text-[#556168]"
                    >
                      Pages to extract (saved into one PDF in the order entered)
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
                  ) : planPreview?.ok && planPreview.mode === "extract" ? (
                    <p className="font-mono text-xs text-[#426579] tabular-nums">
                      {planPreview.plans[0].pages.length}{" "}
                      {planPreview.plans[0].pages.length === 1
                        ? "page selected"
                        : "pages selected"}{" "}
                      · Output: {planPreview.plans[0].filename}
                    </p>
                  ) : (
                    <p className="text-xs text-[#556168]">
                      Document has {inspection.pageCount}{" "}
                      {inspection.pageCount === 1 ? "page" : "pages"} (1–
                      {inspection.pageCount}).
                    </p>
                  )}
                </div>
              ) : null}

              {/* Mode C: Split Every Page */}
              {splitMode === "every-page" ? (
                <div className="space-y-3 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/65 p-4">
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
                          ? "Download all files together as a ZIP archive or save individual pages."
                          : "Ready to output as a single-page PDF."}
                      </p>
                    </>
                  ) : planPreview && !planPreview.ok ? (
                    <p role="alert" className="text-xs text-[#7A2727]">
                      {planPreview.error}
                    </p>
                  ) : (
                    <p className="text-xs text-[#556168]">
                      Up to {MAX_EVERY_PAGE_OUTPUTS} individual page files can
                      be generated at once.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Document Compatibility Limitations Notice */}
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
                  This document contains interactive form fields, outlines, or
                  links. Splitting creates new PDF files, and bookmarks,
                  annotations, document metadata, or cross-page links may not
                  transfer identically.
                </p>
              ) : null}

              {/* Progress Panel */}
              {isSplitting && progress ? (
                <div
                  aria-live="polite"
                  className="space-y-2.5 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/65 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#20272B]">
                        {STAGE_LABELS[progress.stage]}
                      </span>
                      <span className="ml-2 text-[#556168]">
                        {progress.detail}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[#5C7E8F] tabular-nums">
                      {progress.percent !== null
                        ? `${progress.percent}%`
                        : "Working"}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#D4DDE2]">
                    {progress.percent !== null ? (
                      <div
                        className="h-full rounded-full bg-[#1CC8A0] transition-all duration-150"
                        style={{ width: `${progress.percent}%` }}
                      />
                    ) : (
                      <div className="h-full w-1/3 rounded-full bg-[#426579] animate-binro-indeterminate" />
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCancelSplit}
                      className="min-h-[36px] rounded-md px-2 text-xs font-medium text-[#556168] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Bar */}
              <div className="flex flex-col gap-2.5 border-t border-[#D4DDE2]/80 pt-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canStartSplit}
                  className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                >
                  {isSplitting ? "Splitting PDF..." : "Split PDF"}
                </button>
              </div>
            </form>

            {/* Right Column: Plan Preview OR Ready Downloads */}
            <aside
              aria-label="Split plan and downloads"
              className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-5"
            >
              {resultState && !isSplitting ? (
                <div aria-live="polite" className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0E6B56]">
                        Split ready
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#556168] tabular-nums">
                      {resultState.outputs.length}{" "}
                      {resultState.outputs.length === 1 ? "file" : "files"}
                    </span>
                  </div>

                  {/* Primary Download CTA */}
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

                  {/* Output Files List */}
                  <div className="space-y-2 border-t border-[#D4DDE2] pt-4">
                    <p className="text-xs font-medium text-[#5C7E8F]">
                      Generated files
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
                            <p className="mt-0.5 font-mono text-[11px] text-[#556168] tabular-nums">
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
                            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[#D4DDE2] bg-white px-2.5 py-1 text-xs font-medium text-[#426579] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
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
                      Output preview
                    </h2>
                    {planPreview?.ok ? (
                      <span className="font-mono text-xs text-[#426579] tabular-nums">
                        {planPreview.plans.length}{" "}
                        {planPreview.plans.length === 1 ? "file" : "files"}
                      </span>
                    ) : null}
                  </div>

                  {planPreview?.ok ? (
                    <ul className="max-h-[320px] divide-y divide-[#D4DDE2] overflow-y-auto rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/40">
                      {planPreview.plans.slice(0, 50).map((plan) => (
                        <li
                          key={plan.id}
                          className="flex items-center justify-between gap-3 bg-white/80 px-3.5 py-2.5"
                        >
                          <p
                            title={plan.filename}
                            className="min-w-0 truncate font-mono text-xs font-medium text-[#20272B]"
                          >
                            {plan.filename}
                          </p>
                          <span className="shrink-0 font-mono text-[11px] text-[#556168] tabular-nums">
                            {plan.pages.length}{" "}
                            {plan.pages.length === 1 ? "page" : "pages"}
                          </span>
                        </li>
                      ))}
                      {planPreview.plans.length > 50 ? (
                        <li className="px-3.5 py-2.5 text-center font-mono text-xs text-[#5C7E8F] tabular-nums">
                          + {planPreview.plans.length - 50} more files
                        </li>
                      ) : null}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#D4DDE2] bg-[#F3F6F7]/40 px-4 py-8 text-center text-xs text-[#556168]">
                      Enter valid page numbers or ranges to preview your output
                      PDF files.
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* Quiet Privacy Line */}
      <div className="flex items-center justify-between pt-1">
        <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
          <LockIcon className="h-3.5 w-3.5 text-[#5C7E8F]" />
          <span>Your files are processed locally in your browser.</span>
        </p>
      </div>
    </div>
  );
}

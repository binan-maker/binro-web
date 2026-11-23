"use client";

import { useEffect, useRef, useState, type SVGProps } from "react";
import {
  compressPdfFileInBrowser,
  inspectPdfFileInBrowser,
} from "@/lib/pdf/pdf-client";
import {
  MAX_PDF_INPUT_BYTES,
  buildCompressedPdfFilename,
  formatPdfBytes,
  translatePdfError,
  validatePdfFileMetadata,
  type CompressPdfOutput,
  type CompressionMode,
  type CompressionProgress,
  type CompressionStage,
  type PdfInspectionResult,
} from "@/lib/pdf/pdf-compression";

const STAGE_LABELS: Record<CompressionStage, string> = {
  reading: "Reading",
  analyzing: "Inspecting",
  "compressing-images": "Optimising images",
  "optimizing-structure": "Optimising structure",
  generating: "Generating PDF",
  verifying: "Verifying PDF",
};

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

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
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

interface TargetPreset {
  label: string;
  value: number;
  unit: "KB" | "MB";
  bytes: number;
}

const TARGET_PRESETS: TargetPreset[] = [
  { label: "100 KB", value: 100, unit: "KB", bytes: 100 * 1024 },
  { label: "200 KB", value: 200, unit: "KB", bytes: 200 * 1024 },
  { label: "300 KB", value: 300, unit: "KB", bytes: 300 * 1024 },
  { label: "500 KB", value: 500, unit: "KB", bytes: 500 * 1024 },
  { label: "1 MB", value: 1, unit: "MB", bytes: 1024 * 1024 },
];

interface LoadedPdfState {
  file: File;
  name: string;
  sizeBytes: number;
  inspection: PdfInspectionResult;
}

interface PdfResultState {
  output: CompressPdfOutput;
  downloadUrl: string | null;
  filename: string;
}

export function PdfCompressor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const activeCancelRef = useRef<(() => void) | null>(null);

  const [loadedPdf, setLoadedPdf] = useState<LoadedPdfState | null>(null);
  const [resultState, setResultState] = useState<PdfResultState | null>(null);
  const [isResultCurrent, setIsResultCurrent] = useState<boolean>(false);

  const [mode, setMode] = useState<CompressionMode>("recommended");
  const [targetValueInput, setTargetValueInput] = useState<string>("300");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [stripMetadataAndThumbs, setStripMetadataAndThumbs] =
    useState<boolean>(true);
  const [preserveImageResolution, setPreserveImageResolution] =
    useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const revokeDownloadUrl = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      activeCancelRef.current?.();
      activeCancelRef.current = null;
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
    };
  }, []);

  const computeTargetBytes = (): number | null => {
    if (mode !== "target") return null;
    const numeric = Number(targetValueInput);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return targetUnit === "MB"
      ? Math.round(numeric * 1024 * 1024)
      : Math.round(numeric * 1024);
  };

  const handleFileSelection = async (file: File) => {
    const metaError = validatePdfFileMetadata(file);
    if (metaError) {
      setErrorMessage(metaError);
      return;
    }

    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setErrorMessage(null);
    setResultState(null);
    setIsResultCurrent(false);
    setProgress(null);
    setIsInspecting(true);

    try {
      const inspection = await inspectPdfFileInBrowser(file);
      setLoadedPdf({
        file,
        name: file.name,
        sizeBytes: file.size,
        inspection,
      });
    } catch (error) {
      setErrorMessage(translatePdfError(error));
    } finally {
      setIsInspecting(false);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileSelection(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelection(file);
    }
  };

  const handleRemoveFile = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setLoadedPdf(null);
    setResultState(null);
    setIsResultCurrent(false);
    setIsCompressing(false);
    setProgress(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setLoadedPdf(null);
    setResultState(null);
    setIsResultCurrent(false);
    setMode("recommended");
    setTargetValueInput("300");
    setTargetUnit("KB");
    setStripMetadataAndThumbs(true);
    setPreserveImageResolution(false);
    setShowAdvanced(false);
    setIsCompressing(false);
    setProgress(null);
    setErrorMessage(null);
  };

  const handleCancelCompression = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    setIsCompressing(false);
    setProgress(null);
  };

  const runCompression = async (overrideTarget?: {
    value: number;
    unit: "KB" | "MB";
  }) => {
    if (!loadedPdf) {
      setErrorMessage("Please choose a PDF document first.");
      return;
    }

    const effectiveMode: CompressionMode = overrideTarget ? "target" : mode;
    const effectiveVal = overrideTarget
      ? overrideTarget.value
      : Number(targetValueInput);
    const effectiveUnit = overrideTarget ? overrideTarget.unit : targetUnit;

    let targetBytes: number | null = null;
    if (effectiveMode === "target") {
      if (
        !Number.isFinite(effectiveVal) ||
        (effectiveVal < 10 && effectiveUnit === "KB")
      ) {
        setErrorMessage("Enter a custom target size of at least 10 KB.");
        return;
      }
      if (!Number.isFinite(effectiveVal) || effectiveVal <= 0) {
        setErrorMessage("Enter a valid positive target file size.");
        return;
      }
      targetBytes =
        effectiveUnit === "MB"
          ? Math.round(effectiveVal * 1024 * 1024)
          : Math.round(effectiveVal * 1024);

      if (targetBytes >= loadedPdf.sizeBytes) {
        setErrorMessage(
          `Your PDF (${formatPdfBytes(loadedPdf.sizeBytes)}) is already within ${formatPdfBytes(targetBytes)}. Choose a smaller target or use Recommended mode.`
        );
        return;
      }
    }

    if (overrideTarget) {
      setMode("target");
      setTargetValueInput(String(overrideTarget.value));
      setTargetUnit(overrideTarget.unit);
    }

    setErrorMessage(null);
    setIsCompressing(true);
    setProgress({
      stage: "reading",
      percent: null,
      detail: "Starting local PDF compression",
    });

    const job = compressPdfFileInBrowser(
      loadedPdf.file,
      {
        mode: effectiveMode,
        targetSizeBytes: targetBytes,
        stripMetadataAndThumbs,
        preserveImageResolution,
      },
      (p) => setProgress(p)
    );

    activeCancelRef.current = job.cancel;

    try {
      const output = await job.promise;
      activeCancelRef.current = null;

      revokeDownloadUrl();
      let downloadUrl: string | null = null;
      if (output.compressedBytes) {
        const bufferCopy = new Uint8Array(output.compressedBytes.byteLength);
        bufferCopy.set(output.compressedBytes);
        const blob = new Blob([bufferCopy], { type: "application/pdf" });
        downloadUrl = URL.createObjectURL(blob);
        downloadUrlRef.current = downloadUrl;
      }

      setResultState({
        output: { ...output, compressedBytes: null },
        downloadUrl,
        filename: buildCompressedPdfFilename(loadedPdf.name),
      });
      setIsResultCurrent(true);
    } catch (error) {
      activeCancelRef.current = null;
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("cancelled")
      ) {
        return;
      }
      setErrorMessage(translatePdfError(error));
    } finally {
      setIsCompressing(false);
      setProgress(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runCompression();
  };

  const handleDownload = () => {
    if (!resultState?.downloadUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultState.downloadUrl;
    anchor.download = resultState.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const currentTargetBytes = computeTargetBytes();
  const nextGentlerPreset =
    resultState?.output.targetSizeBytes && !resultState.output.targetMet
      ? TARGET_PRESETS.find(
          (p) =>
            p.bytes > (resultState.output.targetSizeBytes ?? 0) &&
            p.bytes >= resultState.output.outputSizeBytes
        ) ??
        TARGET_PRESETS.find(
          (p) => p.bytes > (resultState.output.targetSizeBytes ?? 0)
        ) ??
        null
      : null;

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <input
        ref={fileInputRef}
        id="pdf-file-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileInputChange}
        className="sr-only"
      />

      {errorMessage ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-4 py-3 text-sm text-[#7A2727] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{errorMessage}</span>
          {loadedPdf && !isCompressing ? (
            <button
              type="button"
              onClick={() => void runCompression()}
              className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3 py-1.5 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!loadedPdf ? (
        /* Initial Clean Upload Dropzone */
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
              {isInspecting ? "Reading PDF..." : "Choose PDF"}
            </button>

            <p className="mt-3 text-sm text-[#556168]">or drop it here</p>
            <p className="mt-4 text-xs text-[#5C7E8F]">
              PDF documents up to{" "}
              {Math.round(MAX_PDF_INPUT_BYTES / (1024 * 1024))} MB
            </p>
          </div>
        </div>
      ) : (
        /* Document Summary + Compression Controls Workspace */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start lg:gap-8">
          {/* Document Details & Result Card */}
          <section
            aria-label="Document summary and compression result"
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F6F7] text-[#426579]">
                  <PdfDocumentIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#20272B]">
                    {loadedPdf.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#556168]">
                    PDF document
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[40px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="min-h-[40px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Remove
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
              <div>
                <dt className="text-[#5C7E8F]">Original size</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                  {formatPdfBytes(loadedPdf.sizeBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-[#5C7E8F]">Pages</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                  {loadedPdf.inspection.pageCount}
                </dd>
              </div>
              <div>
                <dt className="text-[#5C7E8F]">Images</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                  {loadedPdf.inspection.imageCount}
                </dd>
              </div>
            </dl>

            {loadedPdf.inspection.hasDigitalSignature ? (
              <p className="rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                This PDF contains a digital signature. Compressing or rewriting
                a signed PDF can invalidate its signature.
              </p>
            ) : null}

            {/* Honest Progress Indicator */}
            {isCompressing && progress ? (
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
                    onClick={handleCancelCompression}
                    className="min-h-[36px] rounded-md px-2 text-xs font-medium text-[#556168] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Compression Result Summary */}
            {resultState && !isCompressing ? (
              <div
                aria-live="polite"
                className="space-y-4 border-t border-[#D4DDE2] pt-5"
              >
                {resultState.output.alreadyOptimized ? (
                  <div className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-4 text-xs leading-relaxed text-[#20272B]">
                    <p className="font-semibold">Already optimised</p>
                    <p className="mt-1 text-[#556168]">
                      {resultState.output.note ??
                        "This PDF could not be reduced further without sacrificing readability. Your original file was preserved."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2">
                        {isResultCurrent ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
                            <CheckIcon className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.06em] ${
                            isResultCurrent
                              ? "text-[#0E6B56]"
                              : "text-[#5C7E8F]"
                          }`}
                        >
                          {isResultCurrent
                            ? "Compressed PDF ready"
                            : "Previous result"}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-medium text-[#426579] tabular-nums">
                        −{resultState.output.percentReduction}%
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="text-[#5C7E8F]">Original</dt>
                        <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                          {formatPdfBytes(resultState.output.originalSizeBytes)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#5C7E8F]">New size</dt>
                        <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                          {formatPdfBytes(resultState.output.outputSizeBytes)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#5C7E8F]">Saved</dt>
                        <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                          {formatPdfBytes(resultState.output.bytesSaved)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#5C7E8F]">Reduction</dt>
                        <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                          {resultState.output.percentReduction}%
                        </dd>
                      </div>
                    </dl>

                    <p className="truncate text-xs text-[#556168]">
                      Output:{" "}
                      <span className="font-mono text-[#20272B]">
                        {resultState.filename}
                      </span>
                    </p>

                    {resultState.output.targetSizeBytes !== null &&
                    !resultState.output.targetMet ? (
                      <div className="space-y-2 rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] p-3.5 text-xs leading-relaxed text-[#5D3D1A]">
                        <p>{resultState.output.note}</p>
                        {nextGentlerPreset ? (
                          <button
                            type="button"
                            onClick={() =>
                              void runCompression({
                                value: nextGentlerPreset.value,
                                unit: nextGentlerPreset.unit,
                              })
                            }
                            className="inline-flex min-h-[32px] items-center rounded-lg border border-[#B47A3C]/45 bg-white px-3 py-1 font-medium text-[#5D3D1A] transition-colors hover:bg-[#FDF5EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            Try {nextGentlerPreset.label} target
                          </button>
                        ) : null}
                      </div>
                    ) : resultState.output.targetSizeBytes !== null ? (
                      <p className="text-xs text-[#426579]">
                        Target met: within{" "}
                        {formatPdfBytes(resultState.output.targetSizeBytes)}.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </section>

          {/* Compression Controls Panel */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-6"
          >
            {/* Mode Switch */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-[#556168]">
                Compression mode
              </p>
              <div
                role="group"
                aria-label="Compression mode"
                className="grid grid-cols-2 gap-1 rounded-xl bg-[#F3F6F7] p-1"
              >
                <button
                  type="button"
                  aria-pressed={mode === "recommended"}
                  onClick={() => {
                    setMode("recommended");
                    setIsResultCurrent(false);
                    setErrorMessage(null);
                  }}
                  className={`min-h-[38px] rounded-lg px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    mode === "recommended"
                      ? "bg-white text-[#20272B] shadow-xs"
                      : "text-[#556168] hover:text-[#20272B]"
                  }`}
                >
                  Recommended
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "target"}
                  onClick={() => {
                    setMode("target");
                    setIsResultCurrent(false);
                    setErrorMessage(null);
                  }}
                  className={`min-h-[38px] rounded-lg px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    mode === "target"
                      ? "bg-white text-[#20272B] shadow-xs"
                      : "text-[#556168] hover:text-[#20272B]"
                  }`}
                >
                  Target file size
                </button>
              </div>
            </div>

            {mode === "recommended" ? (
              <p className="text-xs leading-relaxed text-[#556168]">
                Balances smaller file size with crisp readability while
                preserving selectable text, vector graphics, and links.
              </p>
            ) : (
              <div className="space-y-3 border-t border-[#D4DDE2]/80 pt-5">
                <label
                  htmlFor="target-pdf-size"
                  className="block text-xs font-medium text-[#556168]"
                >
                  Maximum target size
                </label>

                <div className="flex gap-2">
                  <input
                    id="target-pdf-size"
                    type="number"
                    min={targetUnit === "KB" ? 10 : 1}
                    max={targetUnit === "KB" ? 150000 : 150}
                    step={targetUnit === "MB" ? "0.1" : "1"}
                    inputMode="decimal"
                    value={targetValueInput}
                    onChange={(event) => {
                      setTargetValueInput(event.target.value);
                      setIsResultCurrent(false);
                      setErrorMessage(null);
                    }}
                    className="min-h-[42px] flex-1 rounded-lg border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />

                  <div
                    role="group"
                    aria-label="Target size unit"
                    className="grid grid-cols-2 gap-1 rounded-lg bg-[#F3F6F7] p-1"
                  >
                    {(["KB", "MB"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={targetUnit === unit}
                        onClick={() => {
                          setTargetUnit(unit);
                          setIsResultCurrent(false);
                          setErrorMessage(null);
                        }}
                        className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          targetUnit === unit
                            ? "bg-white text-[#20272B] shadow-xs"
                            : "text-[#556168] hover:text-[#20272B]"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {TARGET_PRESETS.map((preset) => {
                    const isSelected =
                      currentTargetBytes !== null &&
                      Math.abs(currentTargetBytes - preset.bytes) < 512;

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setTargetValueInput(String(preset.value));
                          setTargetUnit(preset.unit);
                          setIsResultCurrent(false);
                          setErrorMessage(null);
                        }}
                        className={`min-h-[34px] rounded-lg px-2.5 py-1 font-mono text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          isSelected
                            ? "bg-[#426579] text-white"
                            : "bg-[#F3F6F7] text-[#20272B] hover:bg-[#D4DDE2]/70"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs leading-relaxed text-[#5C7E8F]">
                  Target sizes are best-effort goals. Achievable size depends on
                  document text, fonts, and embedded images.
                </p>
              </div>
            )}

            {/* Discreet Expandable Advanced Settings */}
            <div className="border-t border-[#D4DDE2]/80 pt-4">
              <button
                type="button"
                aria-expanded={showAdvanced}
                aria-controls="pdf-advanced-settings"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-sm py-1 text-xs font-medium text-[#556168] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                <span>Advanced settings</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-150 ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAdvanced ? (
                <div
                  id="pdf-advanced-settings"
                  className="mt-3 space-y-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs"
                >
                  <label className="flex cursor-pointer items-start gap-2.5 text-[#20272B]">
                    <input
                      type="checkbox"
                      checked={stripMetadataAndThumbs}
                      onChange={(event) => {
                        setStripMetadataAndThumbs(event.target.checked);
                        setIsResultCurrent(false);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-[#D4DDE2] accent-[#426579]"
                    />
                    <span>
                      Remove embedded page thumbnails and XML metadata
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-2.5 text-[#20272B]">
                    <input
                      type="checkbox"
                      checked={preserveImageResolution}
                      onChange={(event) => {
                        setPreserveImageResolution(event.target.checked);
                        setIsResultCurrent(false);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-[#D4DDE2] accent-[#426579]"
                    />
                    <span>
                      Keep original image dimensions (quality-only compression)
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            {/* Primary & Download Actions */}
            <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
              {resultState?.downloadUrl && isResultCurrent && !isCompressing ? (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download compressed PDF</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="submit"
                      disabled={isCompressing}
                      className="min-h-[40px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Compress again
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[40px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#556168] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Reset
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isCompressing}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isCompressing ? "Compressing..." : "Compress PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[44px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2.5 text-sm font-medium text-[#556168] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Quiet Privacy Line */}
      <div className="flex items-center justify-between pt-1">
        <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
          <LockIcon className="h-3.5 w-3.5 text-[#5C7E8F]" />
          <span>Your files stay on your device.</span>
        </p>
      </div>
    </div>
  );
}

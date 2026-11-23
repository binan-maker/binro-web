"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  PdfDocumentIcon,
} from "@/components/ui/Icons";
import {
  ToolErrorBanner,
  ToolPrivacyNote,
  ToolProgressCard,
  ToolResultHeader,
  ToolUploadDropzone,
} from "@/components/utilities/ToolUI";

const STAGE_LABELS: Record<CompressionStage, string> = {
  reading: "Reading",
  analyzing: "Inspecting",
  "compressing-images": "Optimising images",
  "optimizing-structure": "Optimising structure",
  generating: "Generating PDF",
  verifying: "Verifying PDF",
};

interface TargetPreset {
  label: string;
  hint: string;
  value: number;
  unit: "KB" | "MB";
  bytes: number;
}

const TARGET_PRESETS: TargetPreset[] = [
  { label: "100 KB", hint: "Forms", value: 100, unit: "KB", bytes: 100 * 1024 },
  { label: "200 KB", hint: "Portals", value: 200, unit: "KB", bytes: 200 * 1024 },
  { label: "300 KB", hint: "Uploads", value: 300, unit: "KB", bytes: 300 * 1024 },
  { label: "500 KB", hint: "Reports", value: 500, unit: "KB", bytes: 500 * 1024 },
  { label: "1 MB", hint: "Email", value: 1, unit: "MB", bytes: 1024 * 1024 },
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
  const sessionIdRef = useRef<number>(0);

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
  const [announcement, setAnnouncement] = useState<string>("");

  const revokeDownloadUrl = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
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

    sessionIdRef.current += 1;
    const currentSession = sessionIdRef.current;

    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setErrorMessage(null);
    setResultState(null);
    setIsResultCurrent(false);
    setIsCompressing(false);
    setProgress(null);
    setIsInspecting(true);

    try {
      const inspection = await inspectPdfFileInBrowser(file);
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      setLoadedPdf({
        file,
        name: file.name,
        sizeBytes: file.size,
        inspection,
      });
      setAnnouncement(
        `Loaded ${file.name}, ${inspection.pageCount} ${inspection.pageCount === 1 ? "page" : "pages"}, ${formatPdfBytes(file.size)}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      setErrorMessage(translatePdfError(error));
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
      void handleFileSelection(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isInspecting || isCompressing) return;
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setErrorMessage("Please select one PDF document at a time.");
      return;
    }
    void handleFileSelection(files[0]);
  };

  const handleRemoveFile = () => {
    sessionIdRef.current += 1;
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setLoadedPdf(null);
    setResultState(null);
    setIsResultCurrent(false);
    setIsInspecting(false);
    setIsCompressing(false);
    setProgress(null);
    setErrorMessage(null);
    setAnnouncement("Removed selected PDF.");
  };

  const handleReset = () => {
    sessionIdRef.current += 1;
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
    setIsInspecting(false);
    setIsCompressing(false);
    setProgress(null);
    setErrorMessage(null);
    setAnnouncement("Reset PDF compressor.");
  };

  const handleCancelCompression = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    setIsCompressing(false);
    setProgress(null);
    setAnnouncement("PDF compression cancelled.");
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
          `Your PDF (${formatPdfBytes(loadedPdf.sizeBytes)}) is already smaller than ${formatPdfBytes(targetBytes)}. Choose a smaller target or use Recommended mode.`
        );
        return;
      }
    }

    if (overrideTarget) {
      setMode("target");
      setTargetValueInput(String(overrideTarget.value));
      setTargetUnit(overrideTarget.unit);
    }

    const currentSession = sessionIdRef.current;
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
      (p) => {
        if (sessionIdRef.current === currentSession) {
          setProgress(p);
        }
      }
    );

    activeCancelRef.current = job.cancel;

    try {
      const output = await job.promise;
      if (sessionIdRef.current !== currentSession) {
        return;
      }
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
      setAnnouncement(
        output.alreadyOptimized
          ? "PDF is already optimised. Original file preserved."
          : `Compression complete: ${formatPdfBytes(output.outputSizeBytes)}, reduced by ${output.percentReduction}%.`
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
      setErrorMessage(translatePdfError(error));
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsCompressing(false);
        setProgress(null);
      }
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

  const compressedBarPercent =
    resultState && resultState.output.originalSizeBytes > 0
      ? Math.max(
          6,
          Math.min(
            100,
            Math.round(
              (resultState.output.outputSizeBytes /
                resultState.output.originalSizeBytes) *
                100
            )
          )
        )
      : 100;

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

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      <ToolErrorBanner
        messages={errorMessage ? [errorMessage] : []}
        onDismiss={() => setErrorMessage(null)}
        onRetry={loadedPdf && !isCompressing ? () => void runCompression() : undefined}
      />

      {!loadedPdf ? (
        <ToolUploadDropzone
          icon={<PdfDocumentIcon className="h-6 w-6" />}
          buttonLabel="Choose a PDF file"
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
          supportText={`Keep text searchable while reducing size · up to ${Math.round(
            MAX_PDF_INPUT_BYTES / (1024 * 1024)
          )} MB`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Document Summary + Visual Size Comparison */}
          <section
            aria-label="Document summary and compression comparison"
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579]">
                  <PdfDocumentIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    title={loadedPdf.name}
                    className="truncate text-sm font-semibold text-[#20272B]"
                  >
                    {loadedPdf.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#556168]">
                    Ready to compress
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="min-h-[42px] rounded-xl px-3 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Remove
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
              <div>
                <dt className="text-[#466677]">Original size</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-[#20272B] tabular-nums">
                  {formatPdfBytes(loadedPdf.sizeBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-[#466677]">Pages</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-[#20272B] tabular-nums">
                  {loadedPdf.inspection.pageCount}
                </dd>
              </div>
              <div>
                <dt className="text-[#466677]">Embedded images</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-[#20272B] tabular-nums">
                  {loadedPdf.inspection.imageCount}
                </dd>
              </div>
            </dl>

            {loadedPdf.inspection.hasDigitalSignature ? (
              <p className="rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                This PDF contains a digital signature. Compressing or rewriting
                a signed document can invalidate its cryptographic signature.
              </p>
            ) : null}

            {!resultState &&
            !isCompressing &&
            loadedPdf.inspection.optimizableImageCount === 0 ? (
              <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 px-3.5 py-2.5 text-xs leading-relaxed text-[#556168]">
                This PDF is mostly text or vector shapes rather than large
                photos, so structural compression may only reduce the size
                slightly.
              </p>
            ) : null}

            {isCompressing && progress ? (
              <ToolProgressCard
                stageLabel={STAGE_LABELS[progress.stage]}
                detail={progress.detail}
                percent={progress.percent}
                onCancel={handleCancelCompression}
              />
            ) : null}

            {/* Compression Result & Visual Size Comparison */}
            {resultState && !isCompressing ? (
              <div
                aria-live="polite"
                className="space-y-4 border-t border-[#D4DDE2] pt-5"
              >
                {resultState.output.alreadyOptimized ? (
                  <div className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-4 text-xs leading-relaxed text-[#20272B]">
                    <p className="font-semibold">Already as compact as possible</p>
                    <p className="mt-1 text-[#556168]">
                      {resultState.output.note ??
                        "This PDF could not be reduced further without hurting readability, so your original file was kept."}
                    </p>
                  </div>
                ) : (
                  <>
                    <ToolResultHeader
                      title={
                        isResultCurrent
                          ? "Compression complete"
                          : "Showing previous result — compress again to update"
                      }
                      isCurrent={isResultCurrent}
                      rightContent={
                        <span className="font-mono text-xs font-semibold text-[#0E6B56] tabular-nums">
                          {resultState.output.percentReduction}% smaller
                        </span>
                      }
                    />

                    {/* Visual Original vs Compressed Comparison Bar */}
                    <div className="space-y-2.5 rounded-xl bg-[#F3F6F7] p-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[#556168]">
                          <span>Original</span>
                          <span className="font-mono font-medium text-[#20272B] tabular-nums">
                            {formatPdfBytes(
                              resultState.output.originalSizeBytes
                            )}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#D4DDE2]">
                          <div className="h-full w-full rounded-full bg-[#5C7E8F]/45" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[#20272B]">
                          <span className="font-medium">Compressed</span>
                          <span className="font-mono font-semibold text-[#0E6B56] tabular-nums">
                            {formatPdfBytes(resultState.output.outputSizeBytes)}{" "}
                            <span className="font-normal text-[#556168]">
                              (saved{" "}
                              {formatPdfBytes(resultState.output.bytesSaved)})
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#D4DDE2]">
                          <div
                            className="h-full rounded-full bg-[#1CC8A0] transition-all duration-200"
                            style={{ width: `${compressedBarPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="truncate text-xs text-[#556168]">
                      Output:{" "}
                      <span
                        title={resultState.filename}
                        className="font-mono text-[#20272B]"
                      >
                        {resultState.filename}
                      </span>
                    </p>

                    {resultState.output.targetSizeBytes !== null &&
                    !resultState.output.targetMet ? (
                      <div className="space-y-2.5 rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] p-3.5 text-xs leading-relaxed text-[#5D3D1A]">
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
                            className="inline-flex min-h-[40px] items-center rounded-lg border border-[#B47A3C]/45 bg-white px-3 py-1 font-medium text-[#5D3D1A] transition-colors hover:bg-[#FDF5EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                          >
                            Try {nextGentlerPreset.label} target
                          </button>
                        ) : null}
                      </div>
                    ) : resultState.output.targetSizeBytes !== null ? (
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E6B56]">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#EAFBF6] text-[#0E6B56]">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <span>
                          Goal met: within{" "}
                          {formatPdfBytes(resultState.output.targetSizeBytes)}
                        </span>
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </section>

          {/* Compression Options Panel */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-6"
          >
            {/* Mode Cards */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[#20272B]">
                Choose how to compress
              </p>
              <div
                role="group"
                aria-label="Compression mode"
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
              >
                <button
                  type="button"
                  aria-pressed={mode === "recommended"}
                  onClick={() => {
                    setMode("recommended");
                    setIsResultCurrent(false);
                    setErrorMessage(null);
                  }}
                  className={`flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    mode === "recommended"
                      ? "border-[#426579] bg-[#F3F6F7] shadow-[inset_0_0_0_1px_#426579]"
                      : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#20272B]">
                      Recommended
                    </span>
                    {mode === "recommended" ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#426579] text-white">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-1 text-xs leading-snug text-[#556168]">
                    Smaller file size while keeping text crisp and readable.
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={mode === "target"}
                  onClick={() => {
                    setMode("target");
                    setIsResultCurrent(false);
                    setErrorMessage(null);
                  }}
                  className={`flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    mode === "target"
                      ? "border-[#426579] bg-[#F3F6F7] shadow-[inset_0_0_0_1px_#426579]"
                      : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#20272B]">
                      Target file size
                    </span>
                    {mode === "target" ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#426579] text-white">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-1 text-xs leading-snug text-[#556168]">
                    Aim for a specific KB or MB upload limit.
                  </span>
                </button>
              </div>
            </div>

            {mode === "target" ? (
              <div className="space-y-3 border-t border-[#D4DDE2]/80 pt-5">
                <label
                  htmlFor="target-pdf-size"
                  className="block text-xs font-semibold text-[#20272B]"
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
                    className="min-h-[44px] flex-1 rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />

                  <div
                    role="group"
                    aria-label="Target size unit"
                    className="grid grid-cols-2 gap-1 rounded-xl bg-[#F3F6F7] p-1"
                  >
                    {(["KB", "MB"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={targetUnit === unit}
                        onClick={() => {
                          if (unit === targetUnit) return;
                          const numeric = Number(targetValueInput);
                          if (Number.isFinite(numeric) && numeric > 0) {
                            if (unit === "MB") {
                              const mb = Math.max(
                                0.1,
                                Math.round((numeric / 1024) * 100) / 100
                              );
                              setTargetValueInput(String(mb));
                            } else {
                              setTargetValueInput(
                                String(Math.max(10, Math.round(numeric * 1024)))
                              );
                            }
                          } else {
                            setTargetValueInput(unit === "MB" ? "1" : "300");
                          }
                          setTargetUnit(unit);
                          setIsResultCurrent(false);
                          setErrorMessage(null);
                        }}
                        className={`min-h-[36px] rounded-lg px-3.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
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
                        className={`min-h-[38px] rounded-lg px-2.5 py-1 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          isSelected
                            ? "bg-[#426579] text-white"
                            : "bg-[#F3F6F7] text-[#20272B] hover:bg-[#D4DDE2]/70"
                        }`}
                      >
                        <span className="font-mono text-xs font-medium tabular-nums">
                          {preset.label}
                        </span>
                        <span
                          className={`ml-1.5 text-[11px] ${
                            isSelected ? "text-white/80" : "text-[#556168]"
                          }`}
                        >
                          · {preset.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs leading-relaxed text-[#556168]">
                  BinRo runs multiple quality passes to stay under your target
                  while keeping text sharp and legible.
                </p>
              </div>
            ) : null}

            {/* Advanced Settings */}
            <div className="border-t border-[#D4DDE2]/80 pt-3">
              <button
                type="button"
                aria-expanded={showAdvanced}
                aria-controls="pdf-advanced-settings"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg py-1.5 text-xs font-medium text-[#556168] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
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
                  className="mt-2.5 space-y-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs"
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
                      Remove embedded page thumbnails and optional metadata
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
                      Keep original image resolution (quality-only compression)
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
                      className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Compress again
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#556168] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Start over
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
                    Start over
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      <ToolPrivacyNote text="Your PDFs stay on your device and are processed locally in your browser." />
    </div>
  );
}

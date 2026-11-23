"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_LOSSY_QUALITY,
  MAX_DIMENSION_PX,
  formatBytes,
  inspectSelectedImage,
  processImageInBrowser,
  validateDimensions,
  type LoadedImageInfo,
  type ProcessedImageResult,
  type SupportedMimeType,
} from "@/lib/image/image-processing";
import { OfflineServiceWorker } from "@/components/utilities/OfflineServiceWorker";
import type { SVGProps } from "react";

function UploadImageIcon(props: SVGProps<SVGSVGElement>) {
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
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.75" cy="9.75" r="1.35" />
      <path d="m6.5 16.5 4-4 2.75 2.75 2.75-3.25 3.5 4.5" />
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

const TARGET_SIZE_PRESETS = [20, 50, 100, 200, 500] as const;

const JPEG_BG_OPTIONS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Light Frost", value: "#F3F6F7" },
  { label: "Black", value: "#000000" },
] as const;

export function ImageResizer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourcePreviewRef = useRef<string | null>(null);
  const resultPreviewRef = useRef<string | null>(null);
  const sessionIdRef = useRef<number>(0);

  const [sourceImage, setSourceImage] = useState<LoadedImageInfo | null>(null);
  const [resultImage, setResultImage] = useState<ProcessedImageResult | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState<"result" | "original">(
    "result"
  );
  const [isResultCurrent, setIsResultCurrent] = useState<boolean>(false);

  const [widthInput, setWidthInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  const [useSizeLimit, setUseSizeLimit] = useState<boolean>(true);
  const [targetSizeInput, setTargetSizeInput] = useState<string>("50");
  const [lossyQualityPercent, setLossyQualityPercent] = useState<number>(
    Math.round(DEFAULT_LOSSY_QUALITY * 100)
  );

  const [outputFormat, setOutputFormat] =
    useState<SupportedMimeType>("image/jpeg");
  const [jpegBackground, setJpegBackground] = useState<string>("#FFFFFF");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      if (sourcePreviewRef.current) {
        URL.revokeObjectURL(sourcePreviewRef.current);
      }
      if (resultPreviewRef.current) {
        URL.revokeObjectURL(resultPreviewRef.current);
      }
    };
  }, []);

  const revokeSourceUrl = () => {
    if (sourcePreviewRef.current) {
      URL.revokeObjectURL(sourcePreviewRef.current);
      sourcePreviewRef.current = null;
    }
  };

  const revokeResultUrl = () => {
    if (resultPreviewRef.current) {
      URL.revokeObjectURL(resultPreviewRef.current);
      resultPreviewRef.current = null;
    }
  };

  const handleFileSelection = async (file: File) => {
    sessionIdRef.current += 1;
    const currentSession = sessionIdRef.current;

    setErrorMessage(null);
    setIsInspecting(true);

    try {
      const info = await inspectSelectedImage(file);
      if (sessionIdRef.current !== currentSession) {
        URL.revokeObjectURL(info.previewUrl);
        return;
      }

      revokeSourceUrl();
      revokeResultUrl();

      sourcePreviewRef.current = info.previewUrl;
      setSourceImage(info);
      setResultImage(null);
      setIsResultCurrent(false);
      setPreviewMode("original");
      setWidthInput(String(info.width));
      setHeightInput(String(info.height));
      setOutputFormat(info.mimeType);
      setAnnouncement(
        `Loaded ${info.name}, ${info.width} by ${info.height} pixels, ${info.formatLabel}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unable to read the selected image file.";
      setErrorMessage(message);
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
    if (isInspecting || isProcessing) return;
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setErrorMessage("Please select one image at a time.");
      return;
    }
    void handleFileSelection(files[0]);
  };

  const handleWidthChange = (rawValue: string) => {
    setWidthInput(rawValue);
    setErrorMessage(null);
    setIsResultCurrent(false);

    if (!maintainAspect || !sourceImage) return;
    if (rawValue.trim() === "") {
      setHeightInput("");
      return;
    }
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspectRatio = sourceImage.width / sourceImage.height;
      setHeightInput(String(Math.max(1, Math.round(parsed / aspectRatio))));
    }
  };

  const handleHeightChange = (rawValue: string) => {
    setHeightInput(rawValue);
    setErrorMessage(null);
    setIsResultCurrent(false);

    if (!maintainAspect || !sourceImage) return;
    if (rawValue.trim() === "") {
      setWidthInput("");
      return;
    }
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspectRatio = sourceImage.width / sourceImage.height;
      setWidthInput(String(Math.max(1, Math.round(parsed * aspectRatio))));
    }
  };

  const handleAspectToggle = (checked: boolean) => {
    setMaintainAspect(checked);
    setIsResultCurrent(false);
    if (checked && sourceImage) {
      const parsedW = Number(widthInput);
      if (Number.isFinite(parsedW) && parsedW > 0) {
        const aspectRatio = sourceImage.width / sourceImage.height;
        setHeightInput(String(Math.max(1, Math.round(parsedW / aspectRatio))));
      }
    }
  };

  const handleRestoreOriginalDimensions = () => {
    if (!sourceImage) return;
    setWidthInput(String(sourceImage.width));
    setHeightInput(String(sourceImage.height));
    setErrorMessage(null);
    setIsResultCurrent(false);
  };

  const handleRemoveImage = () => {
    sessionIdRef.current += 1;
    revokeSourceUrl();
    revokeResultUrl();
    setSourceImage(null);
    setResultImage(null);
    setIsResultCurrent(false);
    setIsInspecting(false);
    setIsProcessing(false);
    setWidthInput("");
    setHeightInput("");
    setErrorMessage(null);
    setAnnouncement("Removed selected image.");
  };

  const handleReset = () => {
    sessionIdRef.current += 1;
    revokeSourceUrl();
    revokeResultUrl();
    setSourceImage(null);
    setResultImage(null);
    setIsResultCurrent(false);
    setIsInspecting(false);
    setIsProcessing(false);
    setPreviewMode("result");
    setWidthInput("");
    setHeightInput("");
    setMaintainAspect(true);
    setUseSizeLimit(true);
    setTargetSizeInput("50");
    setLossyQualityPercent(Math.round(DEFAULT_LOSSY_QUALITY * 100));
    setOutputFormat("image/jpeg");
    setJpegBackground("#FFFFFF");
    setShowAdvanced(false);
    setErrorMessage(null);
    setAnnouncement("Reset image resizer.");
  };

  const handleProcessImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceImage) {
      setErrorMessage("Please choose an image before resizing.");
      return;
    }

    if (widthInput.trim() === "" || heightInput.trim() === "") {
      setErrorMessage("Enter both width and height in pixels.");
      return;
    }

    const parsedWidth = Math.round(Number(widthInput));
    const parsedHeight = Math.round(Number(heightInput));

    const dimError = validateDimensions(parsedWidth, parsedHeight);
    if (dimError) {
      setErrorMessage(dimError);
      return;
    }

    let targetSizeKb: number | null = null;
    if (useSizeLimit && outputFormat !== "image/png") {
      const parsedTarget = Number(targetSizeInput);
      if (!Number.isFinite(parsedTarget) || parsedTarget < 1) {
        setErrorMessage(
          "Enter a maximum file size of at least 1 KB, or disable the limit in Advanced settings."
        );
        return;
      }
      targetSizeKb = parsedTarget;
    }

    const currentSession = sessionIdRef.current;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const processed = await processImageInBrowser(sourceImage, {
        targetWidth: parsedWidth,
        targetHeight: parsedHeight,
        outputFormat,
        targetSizeKb,
        lossyQuality:
          outputFormat !== "image/png" && targetSizeKb === null
            ? lossyQualityPercent / 100
            : null,
        jpegBackgroundColor: jpegBackground,
      });

      if (sessionIdRef.current !== currentSession) {
        URL.revokeObjectURL(processed.previewUrl);
        return;
      }

      revokeResultUrl();
      resultPreviewRef.current = processed.previewUrl;
      setResultImage(processed);
      setIsResultCurrent(true);
      setPreviewMode("result");
      setAnnouncement(
        `Resized image ready: ${processed.outputWidth} by ${processed.outputHeight} pixels, ${formatBytes(processed.outputSizeBytes)}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process this image.";
      setErrorMessage(message);
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsProcessing(false);
      }
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const anchor = document.createElement("a");
    anchor.href = resultImage.previewUrl;
    anchor.download = resultImage.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const showTransparencyNotice =
    sourceImage !== null &&
    outputFormat === "image/jpeg" &&
    (sourceImage.hasTransparency || sourceImage.mimeType !== "image/jpeg");

  const dimensionsChangedFromOriginal =
    sourceImage !== null &&
    (Number(widthInput) !== sourceImage.width ||
      Number(heightInput) !== sourceImage.height);

  const showingResultPreview = Boolean(resultImage && previewMode === "result");

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <input
        ref={fileInputRef}
        id="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
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
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3 py-1 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!sourceImage ? (
        /* Focused Upload Panel */
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
            className={`flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150 sm:min-h-[300px] sm:py-12 ${
              isDragging
                ? "border-[#426579] bg-[#F3F6F7]"
                : "border-[#D4DDE2] bg-[#F3F6F7]/50 hover:border-[#5C7E8F]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#466677]">
              <UploadImageIcon className="h-6 w-6" />
            </div>

            <button
              type="button"
              disabled={isInspecting}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isInspecting ? "Reading image..." : "Choose an image"}
            </button>

            <p className="mt-3 text-sm text-[#556168]">or drop it here</p>
            <p className="mt-4 text-xs text-[#466677]">
              Supported formats: JPG, PNG, WebP (up to 50 MB)
            </p>
          </div>
        </div>
      ) : (
        /* Balanced Preview + Settings Workspace */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Preview & Result Stage */}
          <section
            aria-label="Image preview"
            className="rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-5 lg:col-span-7"
          >
            {/* Preview Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5">
              {resultImage ? (
                <div
                  role="group"
                  aria-label="Preview view"
                  className="inline-flex rounded-lg bg-[#F3F6F7] p-1"
                >
                  <button
                    type="button"
                    aria-pressed={previewMode === "result"}
                    onClick={() => setPreviewMode("result")}
                    className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      previewMode === "result"
                        ? "bg-white text-[#20272B] shadow-xs"
                        : "text-[#4A555C] hover:text-[#20272B]"
                    }`}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewMode === "original"}
                    onClick={() => setPreviewMode("original")}
                    className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      previewMode === "original"
                        ? "bg-white text-[#20272B] shadow-xs"
                        : "text-[#4A555C] hover:text-[#20272B]"
                    }`}
                  >
                    Original
                  </button>
                </div>
              ) : (
                <p
                  title={sourceImage.name}
                  className="min-w-0 flex-1 truncate text-xs font-medium text-[#556168]"
                >
                  {sourceImage.name}
                </p>
              )}

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={isInspecting || isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRemoveImage}
                  className="min-h-[44px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Aspect-Preserving Image Viewport */}
            <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#D4DDE2]/80 bg-[#F3F6F7] p-3 sm:min-h-[300px] sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  showingResultPreview && resultImage
                    ? resultImage.previewUrl
                    : sourceImage.previewUrl
                }
                alt={
                  showingResultPreview && resultImage
                    ? `Processed image preview (${resultImage.outputWidth} by ${resultImage.outputHeight} ${resultImage.outputFormatLabel})`
                    : `Original preview of ${sourceImage.name}`
                }
                className="max-h-[300px] w-auto max-w-full object-contain sm:max-h-[360px] lg:max-h-[400px]"
              />
            </div>

            {/* Metadata or Result Metrics */}
            {showingResultPreview && resultImage ? (
              <div aria-live="polite" className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    {isResultCurrent ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.06em] ${
                        isResultCurrent ? "text-[#0E6B56]" : "text-[#466677]"
                      }`}
                    >
                      {isResultCurrent
                        ? "Resized image ready"
                        : "Previous result"}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#466677]">
                    {resultImage.outputFormatLabel}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-[#466677]">Dimensions</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultImage.outputWidth} × {resultImage.outputHeight}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#466677]">File size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatBytes(resultImage.outputSizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#466677]">Original size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatBytes(resultImage.originalSizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#466677]">Space saved</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultImage.bytesSaved > 0
                        ? `${formatBytes(resultImage.bytesSaved)} (${resultImage.percentReduction}%)`
                        : "0 B"}
                    </dd>
                  </div>
                </dl>

                <p className="truncate text-xs text-[#556168]">
                  Output:{" "}
                  <span
                    title={resultImage.filename}
                    className="font-mono text-[#20272B]"
                  >
                    {resultImage.filename}
                  </span>
                </p>

                {resultImage.targetSizeKb !== null && !resultImage.targetMet ? (
                  <p className="rounded-lg border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                    {resultImage.note ??
                      `Output is ${formatBytes(resultImage.outputSizeBytes)}, above your ${resultImage.targetSizeKb} KB target.`}
                  </p>
                ) : resultImage.targetSizeKb !== null ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E6B56]">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#EAFBF6] text-[#0E6B56]">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span>
                      Target met: within {resultImage.targetSizeKb} KB (
                      {resultImage.outputFormatLabel})
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-[#466677]">Dimensions</dt>
                  <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                    {sourceImage.width} × {sourceImage.height}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#466677]">File size</dt>
                  <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                    {formatBytes(sourceImage.sizeBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#466677]">Format</dt>
                  <dd className="mt-0.5 font-medium text-[#20272B]">
                    {sourceImage.formatLabel}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          {/* Compact Settings Panel */}
          <form
            onSubmit={handleProcessImage}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-5"
          >
            {/* Dimensions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="resize-width"
                    className="block text-xs font-medium text-[#4A555C]"
                  >
                    Width (px)
                  </label>
                  <input
                    id="resize-width"
                    type="number"
                    min={1}
                    max={MAX_DIMENSION_PX}
                    inputMode="numeric"
                    value={widthInput}
                    onChange={(event) => handleWidthChange(event.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resize-height"
                    className="block text-xs font-medium text-[#4A555C]"
                  >
                    Height (px)
                  </label>
                  <input
                    id="resize-height"
                    type="number"
                    min={1}
                    max={MAX_DIMENSION_PX}
                    inputMode="numeric"
                    value={heightInput}
                    onChange={(event) => handleHeightChange(event.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-lg border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2.5 text-sm text-[#20272B]">
                  <input
                    type="checkbox"
                    checked={maintainAspect}
                    onChange={(event) =>
                      handleAspectToggle(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#D4DDE2] accent-[#426579] focus:ring-[#5C7E8F]"
                  />
                  <span>Maintain aspect ratio</span>
                </label>

                {dimensionsChangedFromOriginal ? (
                  <button
                    type="button"
                    onClick={handleRestoreOriginalDimensions}
                    className="min-h-[40px] rounded-md px-2.5 text-xs font-medium text-[#426579] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[36px]"
                  >
                    Use original ({sourceImage.width} × {sourceImage.height})
                  </button>
                ) : null}
              </div>
            </div>

            {/* File Size Target OR Quality Slider */}
            {outputFormat === "image/png" ? (
              useSizeLimit ? (
                <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
                  <div className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 p-3.5 text-xs leading-relaxed text-[#4A555C]">
                    <p className="font-medium text-[#20272B]">
                      PNG keeps lossless quality
                    </p>
                    <p className="mt-1">
                      PNG files do not support KB quality limits. Reduce pixel
                      dimensions above, or switch to JPG or WebP to hit a
                      specific KB target.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOutputFormat("image/jpeg");
                          setIsResultCurrent(false);
                        }}
                        className="min-h-[40px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1 font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[36px]"
                      >
                        Switch to JPG
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutputFormat("image/webp");
                          setIsResultCurrent(false);
                        }}
                        className="min-h-[40px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1 font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[36px]"
                      >
                        Switch to WebP
                      </button>
                    </div>
                  </div>
                </div>
              ) : null
            ) : useSizeLimit ? (
              <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
                <label
                  htmlFor="target-size-kb"
                  className="block text-xs font-medium text-[#4A555C]"
                >
                  Maximum size (KB)
                </label>
                <input
                  id="target-size-kb"
                  type="number"
                  min={1}
                  max={50000}
                  inputMode="numeric"
                  value={targetSizeInput}
                  onChange={(event) => {
                    setTargetSizeInput(event.target.value);
                    setIsResultCurrent(false);
                  }}
                  className="min-h-[42px] w-full rounded-lg border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_SIZE_PRESETS.map((preset) => {
                    const isSelected = Number(targetSizeInput) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setTargetSizeInput(String(preset));
                          setIsResultCurrent(false);
                        }}
                        className={`min-h-[36px] rounded-lg px-2.5 py-1 font-mono text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          isSelected
                            ? "bg-[#426579] text-white"
                            : "bg-[#F3F6F7] text-[#20272B] hover:bg-[#D4DDE2]/70"
                        }`}
                      >
                        {preset} KB
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2 border-t border-[#D4DDE2]/80 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="lossy-quality-range"
                    className="font-medium text-[#4A555C]"
                  >
                    {outputFormat === "image/webp"
                      ? "WebP quality"
                      : "JPEG quality"}
                  </label>
                  <span className="font-mono font-medium text-[#20272B] tabular-nums">
                    {lossyQualityPercent}%
                  </span>
                </div>
                <input
                  id="lossy-quality-range"
                  type="range"
                  min={20}
                  max={96}
                  step={2}
                  value={lossyQualityPercent}
                  onChange={(event) => {
                    setLossyQualityPercent(Number(event.target.value));
                    setIsResultCurrent(false);
                  }}
                  className="h-2 w-full cursor-pointer accent-[#426579]"
                />
                <p className="text-xs text-[#466677]">
                  Higher quality keeps finer detail; lower quality produces
                  smaller files.
                </p>
              </div>
            )}

            {/* Output Format Segmented Control */}
            <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
              <p className="text-xs font-medium text-[#4A555C]">Format</p>
              <div
                role="group"
                aria-label="Output format"
                className="grid grid-cols-3 gap-1 rounded-xl bg-[#F3F6F7] p-1"
              >
                {(
                  [
                    { mime: "image/jpeg", label: "JPG" },
                    { mime: "image/png", label: "PNG" },
                    { mime: "image/webp", label: "WebP" },
                  ] as const
                ).map((fmt) => {
                  const isSelected = outputFormat === fmt.mime;
                  return (
                    <button
                      key={fmt.mime}
                      type="button"
                      onClick={() => {
                        setOutputFormat(fmt.mime);
                        setIsResultCurrent(false);
                      }}
                      aria-pressed={isSelected}
                      className={`min-h-[40px] rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        isSelected
                          ? "bg-white text-[#20272B] shadow-xs"
                          : "text-[#4A555C] hover:text-[#20272B]"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>

              {showTransparencyNotice ? (
                <p className="text-xs text-[#466677]">
                  JPEG replaces transparency with{" "}
                  <span className="font-mono">{jpegBackground}</span> (change in
                  Advanced settings).
                </p>
              ) : null}
            </div>

            {/* Progressive Disclosure: Advanced Settings (collapsed by default) */}
            <div className="border-t border-[#D4DDE2]/80 pt-3">
              <button
                type="button"
                aria-expanded={showAdvanced}
                aria-controls="advanced-settings-panel"
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
                  id="advanced-settings-panel"
                  className="mt-3 space-y-4 rounded-xl bg-[#F3F6F7] p-3.5 text-xs"
                >
                  <label className="flex cursor-pointer items-center gap-2.5 text-[#20272B]">
                    <input
                      type="checkbox"
                      checked={useSizeLimit}
                      onChange={(event) => {
                        setUseSizeLimit(event.target.checked);
                        setIsResultCurrent(false);
                      }}
                      className="h-4 w-4 rounded border-[#D4DDE2] accent-[#426579]"
                    />
                    <span>Enforce maximum file size (KB)</span>
                  </label>

                  {outputFormat === "image/jpeg" ? (
                    <div className="space-y-2 border-t border-[#D4DDE2] pt-3">
                      <p className="font-medium text-[#20272B]">
                        JPEG background fill
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {JPEG_BG_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setJpegBackground(option.value);
                              setIsResultCurrent(false);
                            }}
                            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                              jpegBackground.toUpperCase() === option.value
                                ? "border-[#426579] bg-white font-medium text-[#20272B]"
                                : "border-[#D4DDE2] bg-white/70 text-[#4A555C] hover:border-[#5C7E8F]"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className="h-3 w-3 rounded-xs border border-[#A2A2A2]"
                              style={{ backgroundColor: option.value }}
                            />
                            <span>{option.label}</span>
                          </button>
                        ))}
                        <label className="inline-flex items-center gap-1.5 text-[#4A555C]">
                          <span>Custom</span>
                          <input
                            type="color"
                            aria-label="Custom JPEG background fill colour"
                            value={jpegBackground}
                            onChange={(event) => {
                              setJpegBackground(event.target.value);
                              setIsResultCurrent(false);
                            }}
                            className="h-7 w-7 cursor-pointer rounded border border-[#D4DDE2] bg-white p-0.5"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Primary & Secondary Actions */}
            <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
              {resultImage && isResultCurrent ? (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download image</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      {isProcessing ? "Resizing..." : "Resize again"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#4A555C] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      Reset
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isProcessing ? "Resizing..." : "Resize image"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[44px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2.5 text-sm font-medium text-[#4A555C] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Quiet Privacy & Offline Status Bar */}
      <div className="flex flex-col items-start justify-between gap-2 pt-1 sm:flex-row sm:items-center">
        <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-[#466677]" />
          <span>Your images stay on your device.</span>
        </p>
        <OfflineServiceWorker />
      </div>
    </div>
  );
}

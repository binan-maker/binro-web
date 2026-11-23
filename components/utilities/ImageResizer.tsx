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
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  LinkChainIcon,
  UnlinkChainIcon,
  UploadImageIcon,
} from "@/components/ui/Icons";
import {
  ToolErrorBanner,
  ToolPrivacyNote,
  ToolResultHeader,
  ToolUploadDropzone,
} from "@/components/utilities/ToolUI";

const TARGET_SIZE_PRESETS = [20, 50, 100, 200, 500] as const;
const SCALE_PRESETS = [
  { label: "Original", factor: 1 },
  { label: "75%", factor: 0.75 },
  { label: "50%", factor: 0.5 },
  { label: "25%", factor: 0.25 },
] as const;

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

  const handleAspectToggle = () => {
    const next = !maintainAspect;
    setMaintainAspect(next);
    setIsResultCurrent(false);
    if (next && sourceImage) {
      const parsedW = Number(widthInput);
      if (Number.isFinite(parsedW) && parsedW > 0) {
        const aspectRatio = sourceImage.width / sourceImage.height;
        setHeightInput(String(Math.max(1, Math.round(parsedW / aspectRatio))));
      }
    }
  };

  const handleScalePreset = (factor: number) => {
    if (!sourceImage) return;
    const nextW = Math.max(1, Math.round(sourceImage.width * factor));
    const nextH = Math.max(1, Math.round(sourceImage.height * factor));
    setWidthInput(String(nextW));
    setHeightInput(String(nextH));
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
          "Enter a maximum file size of at least 1 KB, or switch to manual quality in Advanced settings."
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
        `Your resized image is ready: ${processed.outputWidth} by ${processed.outputHeight} pixels, ${formatBytes(processed.outputSizeBytes)}.`
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

      <ToolErrorBanner
        messages={errorMessage ? [errorMessage] : []}
        onDismiss={() => setErrorMessage(null)}
      />

      {!sourceImage ? (
        <ToolUploadDropzone
          icon={<UploadImageIcon className="h-6 w-6" />}
          buttonLabel="Choose an image"
          busyLabel="Reading image..."
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
          helperText="or drop a JPG, PNG, or WebP photo here"
          supportText="Resize by exact pixels or target KB file size · up to 50 MB"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Preview & Before/After Stage */}
          <section
            aria-label="Image preview and comparison"
            className="rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-5 lg:col-span-7"
          >
            {/* Stage Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5">
              {resultImage ? (
                <div
                  role="group"
                  aria-label="Compare original and resized image"
                  className="inline-flex rounded-xl bg-[#F3F6F7] p-1"
                >
                  <button
                    type="button"
                    aria-pressed={previewMode === "result"}
                    onClick={() => setPreviewMode("result")}
                    className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      previewMode === "result"
                        ? "bg-white text-[#20272B] shadow-xs"
                        : "text-[#556168] hover:text-[#20272B]"
                    }`}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewMode === "original"}
                    onClick={() => setPreviewMode("original")}
                    className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      previewMode === "original"
                        ? "bg-white text-[#20272B] shadow-xs"
                        : "text-[#556168] hover:text-[#20272B]"
                    }`}
                  >
                    Original
                  </button>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <p
                    title={sourceImage.name}
                    className="truncate text-sm font-medium text-[#20272B]"
                  >
                    {sourceImage.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#556168]">
                    Original image preview
                  </p>
                </div>
              )}

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={isInspecting || isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[42px] rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRemoveImage}
                  className="min-h-[42px] rounded-xl px-3 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Aspect-Preserving Image Viewport */}
            <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl border border-[#D4DDE2]/80 bg-[#F3F6F7] p-3 sm:min-h-[320px] sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  showingResultPreview && resultImage
                    ? resultImage.previewUrl
                    : sourceImage.previewUrl
                }
                alt={
                  showingResultPreview && resultImage
                    ? `Resized image preview (${resultImage.outputWidth} by ${resultImage.outputHeight} ${resultImage.outputFormatLabel})`
                    : `Original preview of ${sourceImage.name}`
                }
                className="max-h-[320px] w-auto max-w-full rounded-sm object-contain sm:max-h-[380px] lg:max-h-[420px]"
              />
            </div>

            {/* Comparison Summary Strip */}
            {resultImage ? (
              <div aria-live="polite" className="mt-4 space-y-3">
                <ToolResultHeader
                  title={
                    isResultCurrent
                      ? "Your resized image is ready"
                      : "Showing previous result — select Resize image to apply changes"
                  }
                  isCurrent={isResultCurrent}
                  rightContent={
                    <span className="font-mono text-xs text-[#466677]">
                      {resultImage.outputFormatLabel}
                    </span>
                  }
                />

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#D4DDE2]/80 bg-[#F3F6F7]/70 p-3.5 text-xs">
                    <p className="font-medium text-[#556168]">Original</p>
                    <p className="mt-1 font-mono text-sm font-medium text-[#20272B] tabular-nums">
                      {sourceImage.width} × {sourceImage.height} px
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                      {formatBytes(resultImage.originalSizeBytes)} ·{" "}
                      {sourceImage.formatLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#426579]/30 bg-[#F3F6F7] p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[#426579]">Resized</p>
                      {resultImage.bytesSaved > 0 ? (
                        <span className="font-mono text-xs font-medium text-[#0E6B56] tabular-nums">
                          {resultImage.percentReduction}% smaller
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#20272B] tabular-nums">
                      {resultImage.outputWidth} × {resultImage.outputHeight} px
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#20272B] tabular-nums">
                      {formatBytes(resultImage.outputSizeBytes)} ·{" "}
                      {resultImage.outputFormatLabel}
                    </p>
                  </div>
                </div>

                <p className="truncate text-xs text-[#556168]">
                  Filename:{" "}
                  <span
                    title={resultImage.filename}
                    className="font-mono text-[#20272B]"
                  >
                    {resultImage.filename}
                  </span>
                </p>

                {resultImage.targetSizeKb !== null && !resultImage.targetMet ? (
                  <p className="rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                    {resultImage.note ??
                      `Output is ${formatBytes(resultImage.outputSizeBytes)}, above your ${resultImage.targetSizeKb} KB target.`}
                  </p>
                ) : resultImage.targetSizeKb !== null ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E6B56]">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#EAFBF6] text-[#0E6B56]">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span>
                      Within your {resultImage.targetSizeKb} KB target (
                      {resultImage.outputFormatLabel})
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
                <div>
                  <dt className="text-[#466677]">Dimensions</dt>
                  <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                    {sourceImage.width} × {sourceImage.height} px
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

          {/* Controls Panel */}
          <form
            onSubmit={handleProcessImage}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-5"
          >
            {/* Dimensions + Quick Scale */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#20272B]">
                  Dimensions
                </span>
                <div
                  role="group"
                  aria-label="Quick scale presets"
                  className="flex flex-wrap gap-1"
                >
                  {SCALE_PRESETS.map((preset) => {
                    const targetW = Math.max(
                      1,
                      Math.round(sourceImage.width * preset.factor)
                    );
                    const targetH = Math.max(
                      1,
                      Math.round(sourceImage.height * preset.factor)
                    );
                    const isActive =
                      Number(widthInput) === targetW &&
                      Number(heightInput) === targetH;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleScalePreset(preset.factor)}
                        className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          isActive
                            ? "bg-[#426579] text-white"
                            : "bg-[#F3F6F7] text-[#556168] hover:bg-[#D4DDE2]/70 hover:text-[#20272B]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div>
                  <label
                    htmlFor="resize-width"
                    className="block text-xs font-medium text-[#556168]"
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
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />
                </div>

                <button
                  type="button"
                  aria-pressed={maintainAspect}
                  aria-label={
                    maintainAspect
                      ? "Aspect ratio locked. Click to unlock proportions."
                      : "Aspect ratio unlocked. Click to lock proportions."
                  }
                  title={
                    maintainAspect
                      ? "Aspect ratio locked"
                      : "Aspect ratio unlocked"
                  }
                  onClick={handleAspectToggle}
                  className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    maintainAspect
                      ? "border-[#426579]/40 bg-[#F3F6F7] text-[#426579]"
                      : "border-[#D4DDE2] bg-white text-[#556168] hover:border-[#5C7E8F]"
                  }`}
                >
                  {maintainAspect ? (
                    <LinkChainIcon className="h-4 w-4" />
                  ) : (
                    <UnlinkChainIcon className="h-4 w-4" />
                  )}
                </button>

                <div>
                  <label
                    htmlFor="resize-height"
                    className="block text-xs font-medium text-[#556168]"
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
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />
                </div>
              </div>

              <p className="text-xs text-[#556168]">
                {maintainAspect
                  ? "Proportional lock is on so your image will not stretch."
                  : "Proportional lock is off — width and height adjust independently."}
              </p>
            </div>

            {/* Output Format */}
            <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
              <p className="text-xs font-semibold text-[#20272B]">
                Output format
              </p>
              <div
                role="group"
                aria-label="Output format"
                className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F3F6F7] p-1"
              >
                {(
                  [
                    { mime: "image/jpeg", label: "JPG", note: "Photos" },
                    { mime: "image/png", label: "PNG", note: "Lossless" },
                    { mime: "image/webp", label: "WebP", note: "Web" },
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
                      className={`min-h-[42px] rounded-lg px-2 py-1.5 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                        isSelected
                          ? "bg-white text-[#20272B] shadow-xs"
                          : "text-[#556168] hover:text-[#20272B]"
                      }`}
                    >
                      <span className="block text-xs font-semibold">
                        {fmt.label}
                      </span>
                      <span className="block text-[11px] text-[#556168]">
                        {fmt.note}
                      </span>
                    </button>
                  );
                })}
              </div>

              {showTransparencyNotice ? (
                <p className="text-xs text-[#466677]">
                  Transparent areas will use{" "}
                  <span className="font-mono">{jpegBackground}</span> in JPG
                  (adjustable in Advanced settings).
                </p>
              ) : null}
            </div>

            {/* File Size Limit OR Manual Quality */}
            {outputFormat === "image/png" ? (
              useSizeLimit ? (
                <div className="border-t border-[#D4DDE2]/80 pt-5">
                  <div className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 p-3.5 text-xs leading-relaxed text-[#556168]">
                    <p className="font-semibold text-[#20272B]">
                      PNG keeps full lossless detail
                    </p>
                    <p className="mt-1">
                      PNG files cannot use a KB compression cap. Lower the pixel
                      dimensions above, or switch to JPG or WebP to hit an exact
                      KB limit.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOutputFormat("image/jpeg");
                          setIsResultCurrent(false);
                        }}
                        className="min-h-[38px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1 font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Switch to JPG
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOutputFormat("image/webp");
                          setIsResultCurrent(false);
                        }}
                        className="min-h-[38px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1 font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        Switch to WebP
                      </button>
                    </div>
                  </div>
                </div>
              ) : null
            ) : useSizeLimit ? (
              <div className="space-y-2.5 border-t border-[#D4DDE2]/80 pt-5">
                <div className="flex items-baseline justify-between gap-2">
                  <label
                    htmlFor="target-size-kb"
                    className="text-xs font-semibold text-[#20272B]"
                  >
                    Maximum file size (KB)
                  </label>
                  <span className="text-xs text-[#466677]">
                    For forms & portals
                  </span>
                </div>
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
                  className="min-h-[44px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
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
                        className={`min-h-[38px] rounded-lg px-2.5 py-1 font-mono text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
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
                    className="font-semibold text-[#20272B]"
                  >
                    {outputFormat === "image/webp"
                      ? "WebP quality"
                      : "JPG quality"}
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
                <p className="text-xs text-[#556168]">
                  Higher percentages preserve finer detail; lower percentages
                  reduce file size.
                </p>
              </div>
            )}

            {/* Progressive Disclosure: Advanced Settings */}
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
                  className="mt-2.5 space-y-4 rounded-xl bg-[#F3F6F7] p-3.5 text-xs"
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
                    <span>Automatically fit under a KB limit</span>
                  </label>

                  {outputFormat === "image/jpeg" ? (
                    <div className="space-y-2 border-t border-[#D4DDE2] pt-3">
                      <p className="font-medium text-[#20272B]">
                        Background fill for transparent areas
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
                            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                              jpegBackground.toUpperCase() === option.value
                                ? "border-[#426579] bg-white font-medium text-[#20272B]"
                                : "border-[#D4DDE2] bg-white/75 text-[#556168] hover:border-[#5C7E8F]"
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
                        <label className="inline-flex min-h-[36px] items-center gap-1.5 text-[#556168]">
                          <span>Custom</span>
                          <input
                            type="color"
                            aria-label="Custom JPG background fill colour"
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
                    disabled={isProcessing}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isProcessing ? "Resizing..." : "Resize image"}
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

      <ToolPrivacyNote
        text="Your images stay on your device and are never uploaded."
        rightSlot={<OfflineServiceWorker />}
      />
    </div>
  );
}

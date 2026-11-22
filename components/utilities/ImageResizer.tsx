"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_DIMENSION_PX,
  formatBytes,
  inspectSelectedImage,
  processImageInBrowser,
  validateDimensions,
  type LoadedImageInfo,
  type ProcessedImageResult,
  type SupportedMimeType,
} from "@/lib/image/image-processing";
import {
  ChevronDownIcon,
  DownloadIcon,
  LockIcon,
  UploadImageIcon,
} from "@/components/ui/Icons";
import { OfflineServiceWorker } from "@/components/utilities/OfflineServiceWorker";

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

  const [outputFormat, setOutputFormat] =
    useState<SupportedMimeType>("image/jpeg");
  const [jpegBackground, setJpegBackground] = useState<string>("#FFFFFF");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
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
    setErrorMessage(null);
    setIsInspecting(true);

    try {
      const info = await inspectSelectedImage(file);

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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to read the selected image file.";
      setErrorMessage(message);
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

  const handleWidthChange = (rawValue: string) => {
    setWidthInput(rawValue);
    setErrorMessage(null);
    setIsResultCurrent(false);

    if (!maintainAspect || !sourceImage) return;
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

  const handleRemoveImage = () => {
    revokeSourceUrl();
    revokeResultUrl();
    setSourceImage(null);
    setResultImage(null);
    setIsResultCurrent(false);
    setWidthInput("");
    setHeightInput("");
    setErrorMessage(null);
  };

  const handleReset = () => {
    revokeSourceUrl();
    revokeResultUrl();
    setSourceImage(null);
    setResultImage(null);
    setIsResultCurrent(false);
    setPreviewMode("result");
    setWidthInput("");
    setHeightInput("");
    setMaintainAspect(true);
    setUseSizeLimit(true);
    setTargetSizeInput("50");
    setOutputFormat("image/jpeg");
    setJpegBackground("#FFFFFF");
    setShowAdvanced(false);
    setErrorMessage(null);
  };

  const handleProcessImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceImage) {
      setErrorMessage("Please choose an image before resizing.");
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
    if (useSizeLimit) {
      const parsedTarget = Number(targetSizeInput);
      if (!Number.isFinite(parsedTarget) || parsedTarget < 1) {
        setErrorMessage(
          "Enter a maximum file size of at least 1 KB, or disable the limit in Advanced settings."
        );
        return;
      }
      targetSizeKb = parsedTarget;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const processed = await processImageInBrowser(sourceImage, {
        targetWidth: parsedWidth,
        targetHeight: parsedHeight,
        outputFormat,
        targetSizeKb,
        jpegBackgroundColor: jpegBackground,
      });

      revokeResultUrl();
      resultPreviewRef.current = processed.previewUrl;
      setResultImage(processed);
      setIsResultCurrent(true);
      setPreviewMode("result");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process this image.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
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

  const showPngNote = outputFormat === "image/png" && useSizeLimit;
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

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-4 py-3 text-sm text-[#7A2727]"
        >
          {errorMessage}
        </div>
      ) : null}

      {!sourceImage ? (
        /* Focused Upload Panel */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="rounded-2xl border border-[#D4DDE2] bg-white p-4 sm:p-6 shadow-[0_1px_2px_rgba(32,39,43,0.03)]"
        >
          <div
            className={`flex min-h-[290px] sm:min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition-colors duration-150 ${
              isDragging
                ? "border-[#426579] bg-[#F3F6F7]"
                : "border-[#D4DDE2] bg-[#F3F6F7]/50 hover:border-[#5C7E8F]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#5C7E8F]">
              <UploadImageIcon className="h-6 w-6" />
            </div>

            <button
              type="button"
              disabled={isInspecting}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isInspecting ? "Reading image..." : "Choose an image"}
            </button>

            <p className="mt-3 text-sm text-[#4A555C]">or drop it here</p>
            <p className="mt-4 text-xs text-[#5C7E8F]">
              Supported formats: JPG, PNG, WebP
            </p>
          </div>
        </div>
      ) : (
        /* Balanced Preview + Settings Workspace */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start lg:gap-8">
          {/* Preview & Result Stage */}
          <section
            aria-label="Image preview"
            className="rounded-2xl border border-[#D4DDE2] bg-white p-4 sm:p-5 md:col-span-7 shadow-[0_1px_2px_rgba(32,39,43,0.03)]"
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
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
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
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      previewMode === "original"
                        ? "bg-white text-[#20272B] shadow-xs"
                        : "text-[#4A555C] hover:text-[#20272B]"
                    }`}
                  >
                    Original
                  </button>
                </div>
              ) : (
                <p className="truncate max-w-[180px] sm:max-w-[280px] text-xs font-medium text-[#4A555C]">
                  {sourceImage.name}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[36px] rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#4A555C] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Aspect-Preserving Image Viewport */}
            <div className="flex min-h-[220px] sm:min-h-[300px] items-center justify-center overflow-hidden rounded-xl border border-[#D4DDE2]/80 bg-[#F3F6F7] p-3 sm:p-5">
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
                className="max-h-[300px] sm:max-h-[360px] lg:max-h-[400px] w-auto max-w-full object-contain"
              />
            </div>

            {/* Metadata or Result Metrics */}
            {showingResultPreview && resultImage ? (
              <div aria-live="polite" className="mt-4 space-y-3">
                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-[#5C7E8F]">Dimensions</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultImage.outputWidth} × {resultImage.outputHeight}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">File size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatBytes(resultImage.outputSizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">Original size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatBytes(resultImage.originalSizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">Space saved</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultImage.bytesSaved > 0
                        ? `${formatBytes(resultImage.bytesSaved)} (${resultImage.percentReduction}%)`
                        : "0 B"}
                    </dd>
                  </div>
                </dl>

                {resultImage.targetSizeKb !== null && !resultImage.targetMet ? (
                  <p className="rounded-lg border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                    {resultImage.note ??
                      `Output is ${formatBytes(resultImage.outputSizeBytes)}, above your ${resultImage.targetSizeKb} KB target.`}
                  </p>
                ) : resultImage.targetSizeKb !== null ? (
                  <p className="text-xs text-[#426579]">
                    Target met: within {resultImage.targetSizeKb} KB (
                    {resultImage.outputFormatLabel})
                  </p>
                ) : null}
              </div>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-[#5C7E8F]">Dimensions</dt>
                  <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                    {sourceImage.width} × {sourceImage.height}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">File size</dt>
                  <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                    {formatBytes(sourceImage.sizeBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Format</dt>
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
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 sm:p-6 md:col-span-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)]"
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

              <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2.5 text-sm text-[#20272B]">
                <input
                  type="checkbox"
                  checked={maintainAspect}
                  onChange={(event) => handleAspectToggle(event.target.checked)}
                  className="h-4 w-4 rounded border-[#D4DDE2] accent-[#426579] focus:ring-[#5C7E8F]"
                />
                <span>Maintain aspect ratio</span>
              </label>
            </div>

            {/* File Size Target */}
            {useSizeLimit ? (
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
                        className={`min-h-[34px] rounded-lg px-2.5 py-1 font-mono text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
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
            ) : null}

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
                      className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
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

              {showPngNote ? (
                <p className="text-xs text-[#5C7E8F]">
                  PNG is lossless. Switch to JPG or WebP for smaller KB sizes.
                </p>
              ) : null}

              {showTransparencyNotice ? (
                <p className="text-xs text-[#5C7E8F]">
                  JPEG replaces transparency with{" "}
                  <span className="font-mono">{jpegBackground}</span> (change in
                  Advanced settings).
                </p>
              ) : null}
            </div>

            {/* Progressive Disclosure: Advanced Settings (collapsed by default) */}
            <div className="border-t border-[#D4DDE2]/80 pt-4">
              <button
                type="button"
                aria-expanded={showAdvanced}
                aria-controls="advanced-settings-panel"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center justify-between py-1 text-xs font-medium text-[#4A555C] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
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
                            className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
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
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download image</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="min-h-[40px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                    >
                      {isProcessing ? "Resizing..." : "Resize image"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[40px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#4A555C] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
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
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
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
        <p className="inline-flex items-center gap-2 text-xs text-[#4A555C]">
          <LockIcon className="h-3.5 w-3.5 text-[#5C7E8F]" />
          <span>Your images stay on your device.</span>
        </p>
        <OfflineServiceWorker />
      </div>
    </div>
  );
}

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

  const [widthInput, setWidthInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  const [useSizeLimit, setUseSizeLimit] = useState<boolean>(true);
  const [targetSizeInput, setTargetSizeInput] = useState<string>("50");

  const [outputFormat, setOutputFormat] =
    useState<SupportedMimeType>("image/jpeg");
  const [jpegBackground, setJpegBackground] = useState<string>("#FFFFFF");

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up object URLs on unmount to avoid memory leaks.
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
    // Reset input value so re-selecting the same file still fires onChange.
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

    if (!maintainAspect || !sourceImage) return;
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspectRatio = sourceImage.width / sourceImage.height;
      const computedHeight = Math.max(1, Math.round(parsed / aspectRatio));
      setHeightInput(String(computedHeight));
    }
  };

  const handleHeightChange = (rawValue: string) => {
    setHeightInput(rawValue);
    setErrorMessage(null);

    if (!maintainAspect || !sourceImage) return;
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspectRatio = sourceImage.width / sourceImage.height;
      const computedWidth = Math.max(1, Math.round(parsed * aspectRatio));
      setWidthInput(String(computedWidth));
    }
  };

  const handleAspectToggle = (checked: boolean) => {
    setMaintainAspect(checked);
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
    setWidthInput("");
    setHeightInput("");
    setErrorMessage(null);
  };

  const handleReset = () => {
    revokeSourceUrl();
    revokeResultUrl();
    setSourceImage(null);
    setResultImage(null);
    setWidthInput("");
    setHeightInput("");
    setMaintainAspect(true);
    setUseSizeLimit(true);
    setTargetSizeInput("50");
    setOutputFormat("image/jpeg");
    setJpegBackground("#FFFFFF");
    setErrorMessage(null);
  };

  const handleProcessImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceImage) {
      setErrorMessage("Please upload an image before processing.");
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
          "Please enter a valid maximum file size in KB (at least 1 KB)."
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing the image.";
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

  const showTransparencyWarning =
    sourceImage !== null &&
    outputFormat === "image/jpeg" &&
    (sourceImage.hasTransparency || sourceImage.mimeType !== "image/jpeg");

  const showPngSizeNote =
    outputFormat === "image/png" && useSizeLimit;

  return (
    <div className="space-y-8">
      <OfflineServiceWorker />

      {/* Error banner */}
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-5 py-4 text-sm text-[#7A2727]"
        >
          <p className="font-semibold">Unable to complete action</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      {/* Main two-column workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left column: Upload & Previews */}
        <div className="space-y-6 lg:col-span-6">
          {/* 1. Upload Image */}
          <section
            aria-labelledby="upload-heading"
            className="rounded-2xl border border-[#D4DDE2] bg-white p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-[#5C7E8F] tabular-nums">
                  Step 01
                </p>
                <h2
                  id="upload-heading"
                  className="mt-1 text-lg font-semibold text-[#20272B]"
                >
                  Upload image
                </h2>
              </div>
              {sourceImage ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#4A555C] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              id="image-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
              className="sr-only"
            />

            {!sourceImage ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 ${
                  isDragging
                    ? "border-[#426579] bg-[#F3F6F7]"
                    : "border-[#D4DDE2] bg-[#F3F6F7]/55 hover:border-[#5C7E8F]"
                }`}
              >
                <p className="text-sm font-medium text-[#20272B]">
                  {isInspecting
                    ? "Reading image in your browser..."
                    : "Drag and drop a photograph or signature here"}
                </p>
                <p className="mt-1.5 text-xs text-[#4A555C]">
                  Supports JPG, JPEG, PNG, and WebP up to 50 MB
                </p>
                <button
                  type="button"
                  disabled={isInspecting}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 rounded-lg bg-[#426579] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                >
                  Browse files
                </button>
              </div>
            ) : (
              /* 2. Original Preview */
              <div className="mt-5 space-y-4">
                <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceImage.previewUrl}
                    alt={`Original preview of ${sourceImage.name}`}
                    className="max-h-[300px] w-auto max-w-full object-contain"
                  />
                </div>

                <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/60 p-4 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-[#5C7E8F]">Original dimensions</dt>
                    <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                      {sourceImage.width} × {sourceImage.height} px
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">Original size</dt>
                    <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatBytes(sourceImage.sizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">Format</dt>
                    <dd className="mt-1 font-medium text-[#20272B]">
                      {sourceImage.formatLabel}
                      {sourceImage.hasTransparency ? " · Transparent" : ""}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </section>

          {/* 7 & 8. Result Preview & Download */}
          {resultImage ? (
            <section
              aria-labelledby="result-heading"
              aria-live="polite"
              className="rounded-2xl border border-[#5C7E8F]/50 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-[#5C7E8F] tabular-nums">
                    Processed output
                  </p>
                  <h2
                    id="result-heading"
                    className="mt-1 text-lg font-semibold text-[#20272B]"
                  >
                    Ready to download
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-lg bg-[#426579] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                >
                  Download Image
                </button>
              </div>

              <div className="mt-5 flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage.previewUrl}
                  alt={`Processed preview (${resultImage.outputWidth} by ${resultImage.outputHeight} ${resultImage.outputFormatLabel})`}
                  className="max-h-[280px] w-auto max-w-full object-contain"
                />
              </div>

              {/* Target status summary */}
              {resultImage.targetSizeKb !== null ? (
                <div
                  className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                    resultImage.targetMet
                      ? "border-[#5C7E8F]/40 bg-[#F3F6F7] text-[#20272B]"
                      : "border-[#B47A3C]/45 bg-[#FDF9F3] text-[#5D3D1A]"
                  }`}
                >
                  <p className="font-semibold">
                    {resultImage.targetMet
                      ? `Target met: ${formatBytes(resultImage.outputSizeBytes)} is within your ${resultImage.targetSizeKb} KB limit.`
                      : `Target not reached: ${formatBytes(resultImage.outputSizeBytes)} exceeds your ${resultImage.targetSizeKb} KB limit.`}
                  </p>
                  {resultImage.note ? (
                    <p className="mt-1">{resultImage.note}</p>
                  ) : null}
                </div>
              ) : null}

              <dl className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/60 p-4 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-[#5C7E8F]">Output dimensions</dt>
                  <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                    {resultImage.outputWidth} × {resultImage.outputHeight} px
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Output format</dt>
                  <dd className="mt-1 font-medium text-[#20272B]">
                    {resultImage.outputFormatLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Output size</dt>
                  <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                    {formatBytes(resultImage.outputSizeBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Original size</dt>
                  <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                    {formatBytes(resultImage.originalSizeBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Space saved</dt>
                  <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                    {resultImage.bytesSaved > 0
                      ? formatBytes(resultImage.bytesSaved)
                      : "0 B (no reduction)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5C7E8F]">Reduction</dt>
                  <dd className="mt-1 font-mono font-medium text-[#20272B] tabular-nums">
                    {resultImage.percentReduction > 0
                      ? `${resultImage.percentReduction}% smaller`
                      : "0%"}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-xs text-[#4A555C]">
                File name:{" "}
                <span className="font-mono text-[#20272B]">
                  {resultImage.filename}
                </span>
              </p>
            </section>
          ) : null}
        </div>

        {/* Right column: Settings & Process Form */}
        <form
          onSubmit={handleProcessImage}
          className="space-y-6 rounded-2xl border border-[#D4DDE2] bg-white p-6 lg:col-span-6"
        >
          {/* 3. Resize Settings */}
          <fieldset disabled={!sourceImage} className="space-y-4 disabled:opacity-60">
            <legend className="text-base font-semibold text-[#20272B]">
              <span className="mr-2 font-mono text-xs font-medium text-[#5C7E8F]">
                02
              </span>
              Resize dimensions (pixels)
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  placeholder="e.g. 400"
                  className="mt-1.5 w-full rounded-lg border border-[#D4DDE2] bg-white px-3.5 py-2.5 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
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
                  placeholder="e.g. 500"
                  className="mt-1.5 w-full rounded-lg border border-[#D4DDE2] bg-white px-3.5 py-2.5 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                />
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#20272B]">
              <input
                type="checkbox"
                checked={maintainAspect}
                onChange={(event) => handleAspectToggle(event.target.checked)}
                className="h-4 w-4 rounded border-[#D4DDE2] accent-[#426579] focus:ring-[#5C7E8F]"
              />
              <span>Maintain aspect ratio</span>
            </label>
          </fieldset>

          {/* 4. File Size Target */}
          <fieldset
            disabled={!sourceImage}
            className="space-y-4 border-t border-[#D4DDE2] pt-6 disabled:opacity-60"
          >
            <div className="flex items-center justify-between gap-4">
              <legend className="text-base font-semibold text-[#20272B]">
                <span className="mr-2 font-mono text-xs font-medium text-[#5C7E8F]">
                  03
                </span>
                Maximum file size (KB)
              </legend>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4A555C]">
                <input
                  type="checkbox"
                  checked={useSizeLimit}
                  onChange={(event) => setUseSizeLimit(event.target.checked)}
                  className="h-4 w-4 rounded border-[#D4DDE2] accent-[#426579]"
                />
                <span>Enable target limit</span>
              </label>
            </div>

            {useSizeLimit ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {TARGET_SIZE_PRESETS.map((preset) => {
                    const isSelected = Number(targetSizeInput) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetSizeInput(String(preset))}
                        className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                          isSelected
                            ? "bg-[#426579] text-white"
                            : "border border-[#D4DDE2] bg-[#F3F6F7] text-[#20272B] hover:border-[#5C7E8F]"
                        }`}
                      >
                        {preset} KB
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="target-size-kb"
                    className="block text-xs font-medium text-[#4A555C]"
                  >
                    Custom maximum file size (KB)
                  </label>
                  <input
                    id="target-size-kb"
                    type="number"
                    min={1}
                    max={50000}
                    inputMode="numeric"
                    value={targetSizeInput}
                    onChange={(event) => setTargetSizeInput(event.target.value)}
                    placeholder="e.g. 50"
                    className="mt-1.5 w-full rounded-lg border border-[#D4DDE2] bg-white px-3.5 py-2.5 font-mono text-sm text-[#20272B] tabular-nums focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#4A555C]">
                No KB limit selected. The image will export at standard high
                quality for the chosen format.
              </p>
            )}
          </fieldset>

          {/* 5. Output Format */}
          <fieldset
            disabled={!sourceImage}
            className="space-y-4 border-t border-[#D4DDE2] pt-6 disabled:opacity-60"
          >
            <legend className="text-base font-semibold text-[#20272B]">
              <span className="mr-2 font-mono text-xs font-medium text-[#5C7E8F]">
                04
              </span>
              Output format
            </legend>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { mime: "image/jpeg", label: "JPG / JPEG" },
                  { mime: "image/png", label: "PNG" },
                  { mime: "image/webp", label: "WebP" },
                ] as const
              ).map((fmt) => {
                const isSelected = outputFormat === fmt.mime;
                return (
                  <button
                    key={fmt.mime}
                    type="button"
                    onClick={() => setOutputFormat(fmt.mime)}
                    aria-pressed={isSelected}
                    className={`rounded-lg px-3 py-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                      isSelected
                        ? "bg-[#426579] text-white"
                        : "border border-[#D4DDE2] bg-[#F3F6F7] text-[#20272B] hover:border-[#5C7E8F]"
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>

            {showPngSizeNote ? (
              <div className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-3.5 text-xs leading-relaxed text-[#4A555C]">
                PNG uses lossless compression and does not adjust quality to hit
                a KB limit. If you need a smaller file size, select{" "}
                <strong className="font-medium text-[#20272B]">
                  JPG / JPEG
                </strong>{" "}
                or <strong className="font-medium text-[#20272B]">WebP</strong>.
              </div>
            ) : null}

            {showTransparencyWarning ? (
              <div className="space-y-3 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-3.5 text-xs text-[#4A555C]">
                <p className="leading-relaxed">
                  <strong className="font-medium text-[#20272B]">
                    Transparency notice:
                  </strong>{" "}
                  JPEG does not support transparent backgrounds.{" "}
                  {sourceImage?.hasTransparency
                    ? "Your image contains transparent pixels, which will be filled with the background colour below."
                    : "Any transparent areas in this format will be filled with the background colour below."}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#20272B]">
                    Background fill:
                  </span>
                  {JPEG_BG_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setJpegBackground(option.value)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        jpegBackground.toUpperCase() === option.value
                          ? "border-[#426579] bg-white font-medium text-[#20272B]"
                          : "border-[#D4DDE2] bg-white/70 text-[#4A555C] hover:border-[#5C7E8F]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 rounded-sm border border-[#A2A2A2]"
                        style={{ backgroundColor: option.value }}
                      />
                      <span>{option.label}</span>
                    </button>
                  ))}
                  <label className="inline-flex items-center gap-1.5 text-xs text-[#4A555C]">
                    <span>Custom:</span>
                    <input
                      type="color"
                      aria-label="Custom JPEG background fill colour"
                      value={jpegBackground}
                      onChange={(event) => setJpegBackground(event.target.value)}
                      className="h-6 w-7 cursor-pointer rounded border border-[#D4DDE2] bg-white p-0.5"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </fieldset>

          {/* 6. Process & Reset Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#D4DDE2] pt-6">
            <button
              type="submit"
              disabled={!sourceImage || isProcessing}
              className="flex-1 rounded-lg bg-[#426579] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isProcessing ? "Processing in browser..." : "Process image"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-[#D4DDE2] bg-white px-5 py-3 text-sm font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

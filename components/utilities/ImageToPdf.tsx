"use client";

import { useEffect, useRef, useState, type SVGProps } from "react";
import {
  MAX_IMAGES_PER_PDF,
  MAX_SINGLE_IMAGE_BYTES,
  MAX_TOTAL_IMAGE_BYTES,
  formatFileBytes,
  sanitizeImagePdfFilename,
  validateImageFileMetadata,
  type ImagePdfSettings,
  type ImageRotationDegrees,
  type ImageToPdfProgress,
  type PdfMarginOption,
  type PdfOrientationOption,
  type PdfPageSizeOption,
  type SupportedImageToPdfMime,
} from "@/lib/image/image-to-pdf-core";
import {
  convertImagesToPdfInBrowser,
  inspectImageForPdf,
} from "@/lib/image/image-to-pdf";

function ImageStackIcon(props: SVGProps<SVGSVGElement>) {
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

function ChevronUpIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m5.5 12.5 4.5-4.5 4.5 4.5" />
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

function RotateRightIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M15.5 7.5V4h-3.5" />
      <path d="M15.2 7.5A5.5 5.5 0 1 0 15.5 11" />
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

function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx="7" cy="5.5" r="1.2" />
      <circle cx="13" cy="5.5" r="1.2" />
      <circle cx="7" cy="10" r="1.2" />
      <circle cx="13" cy="10" r="1.2" />
      <circle cx="7" cy="14.5" r="1.2" />
      <circle cx="13" cy="14.5" r="1.2" />
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

interface QueuedImageItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: SupportedImageToPdfMime;
  formatLabel: string;
  width: number;
  height: number;
  hasTransparency: boolean;
  isAnimatedGif: boolean;
  exifOrientation: number;
  rotation: ImageRotationDegrees;
  previewUrl: string;
}

interface ConversionResultState {
  downloadUrl: string;
  pageCount: number;
  outputSizeBytes: number;
}

const STAGE_LABELS: Record<ImageToPdfProgress["stage"], string> = {
  preparing: "Preparing images",
  generating: "Building PDF",
  verifying: "Verifying PDF",
};

const PAGE_SIZE_OPTIONS: { id: PdfPageSizeOption; label: string; hint: string }[] = [
  { id: "a4", label: "A4", hint: "210 × 297 mm" },
  { id: "letter", label: "US Letter", hint: "8.5 × 11 in" },
  { id: "fit", label: "Fit to Image", hint: "Matches image size" },
];

const ORIENTATION_OPTIONS: { id: PdfOrientationOption; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
];

const MARGIN_OPTIONS: { id: PdfMarginOption; label: string }[] = [
  { id: "none", label: "No margin" },
  { id: "small", label: "Small margin" },
  { id: "large", label: "Large margin" },
];

function createItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ImageToPdf() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const sessionIdRef = useRef<number>(0);

  const [queuedImages, setQueuedImages] = useState<QueuedImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PdfPageSizeOption>("a4");
  const [orientation, setOrientation] = useState<PdfOrientationOption>("auto");
  const [margin, setMargin] = useState<PdfMarginOption>("small");
  const [outputFilenameInput, setOutputFilenameInput] =
    useState<string>("binro-images.pdf");

  const [resultState, setResultState] = useState<ConversionResultState | null>(
    null
  );
  const [isResultCurrent, setIsResultCurrent] = useState<boolean>(false);

  const [isDraggingUpload, setIsDraggingUpload] = useState<boolean>(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ImageToPdfProgress | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");

  const revokeDownloadUrl = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  };

  const revokePreviewUrl = (url: string) => {
    if (previewUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(url);
    }
  };

  useEffect(() => {
    const trackedPreviews = previewUrlsRef.current;
    return () => {
      sessionIdRef.current += 1;
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
      for (const url of trackedPreviews) {
        URL.revokeObjectURL(url);
      }
      trackedPreviews.clear();
    };
  }, []);

  const invalidateResult = () => {
    setIsResultCurrent(false);
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const currentSession = sessionIdRef.current;
    const errors: string[] = [];
    const added: QueuedImageItem[] = [];

    let runningCount = queuedImages.length;
    let runningBytes = queuedImages.reduce((sum, item) => sum + item.sizeBytes, 0);

    setIsInspecting(true);
    setErrorMessages([]);

    try {
      for (const file of incoming) {
        if (sessionIdRef.current !== currentSession) {
          for (const item of added) {
            revokePreviewUrl(item.previewUrl);
          }
          return;
        }

        if (runningCount >= MAX_IMAGES_PER_PDF) {
          errors.push(
            `Skipped "${file.name}": You can convert up to ${MAX_IMAGES_PER_PDF} images into one PDF at a time.`
          );
          continue;
        }

        const metaError = validateImageFileMetadata(file);
        if (metaError) {
          errors.push(metaError);
          continue;
        }

        if (runningBytes + file.size > MAX_TOTAL_IMAGE_BYTES) {
          const maxTotalMb = Math.round(MAX_TOTAL_IMAGE_BYTES / (1024 * 1024));
          errors.push(
            `Skipped "${file.name}": Total combined image size exceeds the ${maxTotalMb} MB browser limit.`
          );
          continue;
        }

        try {
          const inspected = await inspectImageForPdf(file);
          if (sessionIdRef.current !== currentSession) {
            URL.revokeObjectURL(inspected.previewUrl);
            return;
          }

          previewUrlsRef.current.add(inspected.previewUrl);
          runningCount += 1;
          runningBytes += file.size;

          added.push({
            id: createItemId(),
            file: inspected.file,
            name: inspected.name,
            sizeBytes: inspected.sizeBytes,
            mimeType: inspected.mimeType,
            formatLabel: inspected.formatLabel,
            width: inspected.width,
            height: inspected.height,
            hasTransparency: inspected.hasTransparency,
            isAnimatedGif: inspected.isAnimatedGif,
            exifOrientation: inspected.exifOrientation,
            rotation: 0,
            previewUrl: inspected.previewUrl,
          });
        } catch (err) {
          if (sessionIdRef.current !== currentSession) {
            return;
          }
          errors.push(
            err instanceof Error
              ? err.message
              : `Could not read "${file.name}". Please choose a valid image file.`
          );
        }
      }
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsInspecting(false);
      }
    }

    if (sessionIdRef.current !== currentSession) {
      for (const item of added) {
        revokePreviewUrl(item.previewUrl);
      }
      return;
    }

    if (added.length > 0) {
      setQueuedImages((prev) => [...prev, ...added]);
      invalidateResult();
      setAnnouncement(
        `Added ${added.length} ${added.length === 1 ? "image" : "images"}.`
      );
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      void addFiles(files);
    }
    event.target.value = "";
  };

  const handleUploadDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingUpload(false);
    if (draggedItemId) return;
    if (isInspecting || isConverting) return;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (isConverting) return;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= queuedImages.length ||
      toIndex >= queuedImages.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const movedName = queuedImages[fromIndex].name;
    setQueuedImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    invalidateResult();
    setErrorMessages([]);
    setAnnouncement(
      `Moved "${movedName}" to position ${toIndex + 1} of ${queuedImages.length}.`
    );
  };

  const rotateItem = (id: string) => {
    if (isConverting) return;
    const target = queuedImages.find((item) => item.id === id);
    const nextRotation = target
      ? (((target.rotation + 90) % 360) as ImageRotationDegrees)
      : 0;

    setQueuedImages((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rotation: ((item.rotation + 90) % 360) as ImageRotationDegrees,
            }
          : item
      )
    );
    invalidateResult();
    setErrorMessages([]);
    if (target) {
      setAnnouncement(`Rotated "${target.name}" to ${nextRotation} degrees.`);
    }
  };

  const removeItem = (id: string) => {
    if (isConverting) return;
    const target = queuedImages.find((item) => item.id === id);
    if (target) {
      revokePreviewUrl(target.previewUrl);
      setAnnouncement(`Removed "${target.name}".`);
    }
    setQueuedImages((prev) => prev.filter((item) => item.id !== id));
    invalidateResult();
    setErrorMessages([]);
  };

  const handleReset = () => {
    sessionIdRef.current += 1;
    revokeDownloadUrl();
    for (const url of previewUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    previewUrlsRef.current.clear();

    setQueuedImages([]);
    setResultState(null);
    setIsResultCurrent(false);
    setOutputFilenameInput("binro-images.pdf");
    setIsInspecting(false);
    setIsConverting(false);
    setProgress(null);
    setErrorMessages([]);
    setDraggedItemId(null);
    setDragOverItemId(null);
    setAnnouncement("Cleared all selected images.");
  };

  const handleConvert = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (isConverting || isInspecting || queuedImages.length === 0) return;

    const currentSession = sessionIdRef.current;
    setErrorMessages([]);
    setIsConverting(true);
    setProgress({
      stage: "preparing",
      detail: `Preparing ${queuedImages.length} ${queuedImages.length === 1 ? "image" : "images"}`,
    });

    const settings: ImagePdfSettings = {
      pageSize,
      orientation,
      margin,
      placement: "fit",
    };

    try {
      const output = await convertImagesToPdfInBrowser(
        queuedImages.map((item) => ({
          file: item.file,
          name: item.name,
          mimeType: item.mimeType,
          hasTransparency: item.hasTransparency,
          exifOrientation: item.exifOrientation,
          rotation: item.rotation,
        })),
        settings,
        (nextProgress) => {
          if (sessionIdRef.current === currentSession) {
            setProgress(nextProgress);
          }
        }
      );

      if (sessionIdRef.current !== currentSession) {
        return;
      }

      revokeDownloadUrl();
      const copy = new Uint8Array(output.pdfBytes.byteLength);
      copy.set(output.pdfBytes);
      const blob = new Blob([copy], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      downloadUrlRef.current = downloadUrl;

      setResultState({
        downloadUrl,
        pageCount: output.pageCount,
        outputSizeBytes: output.outputSizeBytes,
      });
      setIsResultCurrent(true);
      setAnnouncement(
        `PDF ready with ${output.pageCount} ${output.pageCount === 1 ? "page" : "pages"}.`
      );
    } catch (error) {
      if (sessionIdRef.current !== currentSession) {
        return;
      }
      setErrorMessages([
        error instanceof Error
          ? error.message
          : "Could not convert these images to PDF. Please verify your files and try again.",
      ]);
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsConverting(false);
        setProgress(null);
      }
    }
  };

  const sanitizedDownloadFilename =
    sanitizeImagePdfFilename(outputFilenameInput);

  const handleDownload = () => {
    if (!resultState?.downloadUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultState.downloadUrl;
    anchor.download = sanitizedDownloadFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const totalBytes = queuedImages.reduce((sum, item) => sum + item.sizeBytes, 0);
  const hasAnimatedGif = queuedImages.some((item) => item.isAnimatedGif);
  const canConvert =
    queuedImages.length >= 1 && !isConverting && !isInspecting;

  const maxPerImageMb = Math.round(MAX_SINGLE_IMAGE_BYTES / (1024 * 1024));
  const maxTotalMb = Math.round(MAX_TOTAL_IMAGE_BYTES / (1024 * 1024));

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <input
        ref={fileInputRef}
        id="image-to-pdf-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,.jpg,.jpeg,.png,.webp,.bmp,.gif"
        multiple
        onChange={handleFileInputChange}
        className="sr-only"
      />

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {errorMessages.length > 0 ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-4 py-3 text-sm text-[#7A2727] sm:flex-row sm:items-start sm:justify-between"
        >
          <ul className="space-y-1">
            {errorMessages.map((msg, idx) => (
              <li key={`${idx}-${msg}`}>{msg}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setErrorMessages([])}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3 py-1 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {queuedImages.length === 0 ? (
        /* Initial Clean Multi-Image Dropzone */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingUpload(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDraggingUpload(false);
            }
          }}
          onDrop={handleUploadDrop}
          className="rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6"
        >
          <div
            className={`flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition-colors duration-150 sm:min-h-[320px] ${
              isDraggingUpload
                ? "border-[#426579] bg-[#F3F6F7]"
                : "border-[#D4DDE2] bg-[#F3F6F7]/50 hover:border-[#5C7E8F]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#5C7E8F]">
              <ImageStackIcon className="h-6 w-6" />
            </div>

            <button
              type="button"
              disabled={isInspecting}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isInspecting ? "Reading images..." : "Choose Images"}
            </button>

            <p className="mt-3 text-sm text-[#556168]">
              or drag and drop images here
            </p>
            <p className="mt-4 text-xs text-[#5C7E8F]">
              JPG, JPEG, PNG, WebP, BMP, GIF · Up to {MAX_IMAGES_PER_PDF} images
              · {maxPerImageMb} MB per image · {maxTotalMb} MB total
            </p>
          </div>
        </div>
      ) : (
        /* Ordered Image Queue + Layout Settings Workspace */
        <div
          onDragOver={(event) => {
            if (!draggedItemId) {
              event.preventDefault();
              setIsDraggingUpload(true);
            }
          }}
          onDragLeave={(event) => {
            if (
              !draggedItemId &&
              !event.currentTarget.contains(event.relatedTarget as Node)
            ) {
              setIsDraggingUpload(false);
            }
          }}
          onDrop={handleUploadDrop}
          className={`grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start lg:gap-8 rounded-2xl transition-colors ${
            isDraggingUpload ? "ring-2 ring-[#5C7E8F]/40" : ""
          }`}
        >
          {/* Left Column: Ordered Image List */}
          <section
            aria-label="Selected images in PDF page order"
            className="space-y-4 rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#20272B]">
                  Images to convert
                </h2>
                <p className="mt-0.5 font-mono text-xs text-[#5C7E8F] tabular-nums">
                  {queuedImages.length}{" "}
                  {queuedImages.length === 1 ? "image" : "images"} ·{" "}
                  {queuedImages.length}{" "}
                  {queuedImages.length === 1 ? "PDF page" : "PDF pages"} ·{" "}
                  {formatFileBytes(totalBytes)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    isConverting ||
                    isInspecting ||
                    queuedImages.length >= MAX_IMAGES_PER_PDF
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] whitespace-nowrap transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  <PlusIcon className="h-3.5 w-3.5 text-[#5C7E8F]" />
                  <span>{isInspecting ? "Adding..." : "Add More Images"}</span>
                </button>
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={handleReset}
                  className="min-h-[40px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#556168] whitespace-nowrap transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Clear all
                </button>
              </div>
            </div>

            {hasAnimatedGif ? (
              <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 px-3.5 py-2.5 text-xs leading-relaxed text-[#556168]">
                Animated GIFs are supported using their first frame in the
                generated PDF.
              </p>
            ) : null}

            <ol className="divide-y divide-[#D4DDE2] rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/35">
              {queuedImages.map((item, index) => {
                const isDragTarget =
                  dragOverItemId === item.id && draggedItemId !== item.id;
                const swapAxes = item.rotation === 90 || item.rotation === 270;
                const displayW = swapAxes ? item.height : item.width;
                const displayH = swapAxes ? item.width : item.height;

                return (
                  <li
                    key={item.id}
                    draggable={!isConverting}
                    onDragStart={(event) => {
                      if (isConverting) return;
                      setDraggedItemId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragOver={(event) => {
                      if (!draggedItemId || isConverting) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (dragOverItemId !== item.id) {
                        setDragOverItemId(item.id);
                      }
                    }}
                    onDrop={(event) => {
                      if (!draggedItemId || isConverting) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const fromIdx = queuedImages.findIndex(
                        (img) => img.id === draggedItemId
                      );
                      if (fromIdx !== -1 && fromIdx !== index) {
                        moveItem(fromIdx, index);
                      }
                      setDraggedItemId(null);
                      setDragOverItemId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedItemId(null);
                      setDragOverItemId(null);
                    }}
                    className={`flex flex-col gap-3 px-3.5 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isDragTarget
                        ? "bg-[#E9EFF2]"
                        : draggedItemId === item.id
                          ? "opacity-60"
                          : "bg-white/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[#A2A2A2] sm:inline-flex"
                      >
                        <GripIcon className="h-4 w-4" />
                      </span>

                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3F6F7] font-mono text-xs font-medium text-[#426579] tabular-nums">
                        {index + 1}
                      </span>

                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#D4DDE2] bg-[#F3F6F7]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={`Preview of ${item.name}`}
                          className="h-full w-full object-contain p-0.5 transition-transform duration-150"
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          title={item.name}
                          className="truncate text-sm font-medium text-[#20272B]"
                        >
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                          {item.formatLabel} · {displayW} × {displayH} px ·{" "}
                          {formatFileBytes(item.sizeBytes)}
                          {item.rotation !== 0 ? ` · ${item.rotation}°` : ""}
                        </p>
                        {item.isAnimatedGif ? (
                          <p className="mt-0.5 text-[11px] text-[#5C7E8F]">
                            Animated GIF: first frame only
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1 pl-8 sm:pl-0">
                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => rotateItem(item.id)}
                        aria-label={`Rotate ${item.name} 90 degrees clockwise`}
                        title="Rotate 90°"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        <RotateRightIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={index === 0 || isConverting}
                        onClick={() => moveItem(index, index - 1)}
                        aria-label={`Move ${item.name} up`}
                        title="Move up"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-35 disabled:hover:border-[#D4DDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index === queuedImages.length - 1 || isConverting
                        }
                        onClick={() => moveItem(index, index + 1)}
                        aria-label={`Move ${item.name} down`}
                        title="Move down"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-35 disabled:hover:border-[#D4DDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove image"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#556168] transition-colors hover:bg-[#FDF5F5] hover:text-[#7A2727] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="text-xs text-[#556168]">
              Drag rows or use the up and down controls to set page order. Drop
              more images anywhere here to add them.
            </p>
          </section>

          {/* Right Column: Page Settings, Progress & Output */}
          <form
            onSubmit={handleConvert}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 md:col-span-5"
          >
            {/* Page Size */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#5C7E8F]">
                Page size
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {PAGE_SIZE_OPTIONS.map((opt) => {
                  const active = pageSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isConverting}
                      aria-pressed={active}
                      onClick={() => {
                        setPageSize(opt.id);
                        invalidateResult();
                      }}
                      className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] disabled:opacity-60 ${
                        active
                          ? "border-[#426579] bg-[#F3F6F7] text-[#20272B] shadow-[inset_0_0_0_1px_#426579]"
                          : "border-[#D4DDE2] bg-white text-[#556168] hover:border-[#5C7E8F] hover:text-[#20272B]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1CC8A0]"
                          />
                        ) : null}
                        <span>{opt.label}</span>
                      </span>
                      <span className="mt-0.5 text-[10px] text-[#5C7E8F]">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Orientation */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#5C7E8F]">
                Orientation
              </legend>
              {pageSize === "fit" ? (
                <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/70 px-3 py-2.5 text-xs text-[#556168]">
                  Matched automatically to each image&apos;s dimensions when Page
                  size is set to Fit to Image.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ORIENTATION_OPTIONS.map((opt) => {
                    const active = orientation === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isConverting}
                        aria-pressed={active}
                        onClick={() => {
                          setOrientation(opt.id);
                          invalidateResult();
                        }}
                        className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] disabled:opacity-60 ${
                          active
                            ? "border-[#426579] bg-[#F3F6F7] text-[#20272B] shadow-[inset_0_0_0_1px_#426579]"
                            : "border-[#D4DDE2] bg-white text-[#556168] hover:border-[#5C7E8F] hover:text-[#20272B]"
                        }`}
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1CC8A0]"
                          />
                        ) : null}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {/* Margins */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#5C7E8F]">
                Margins
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {MARGIN_OPTIONS.map((opt) => {
                  const active = margin === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isConverting}
                      aria-pressed={active}
                      onClick={() => {
                        setMargin(opt.id);
                        invalidateResult();
                      }}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] disabled:opacity-60 ${
                        active
                          ? "border-[#426579] bg-[#F3F6F7] text-[#20272B] shadow-[inset_0_0_0_1px_#426579]"
                          : "border-[#D4DDE2] bg-white text-[#556168] hover:border-[#5C7E8F] hover:text-[#20272B]"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1CC8A0]"
                        />
                      ) : null}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#556168]">
                Images are centered and fitted proportionally without cropping or
                stretching.
              </p>
            </fieldset>

            {/* Output Filename */}
            <div className="space-y-1.5">
              <label
                htmlFor="image-to-pdf-filename"
                className="block text-xs font-medium text-[#5C7E8F]"
              >
                Output filename
              </label>
              <input
                id="image-to-pdf-filename"
                type="text"
                value={outputFilenameInput}
                disabled={isConverting}
                onChange={(event) => setOutputFilenameInput(event.target.value)}
                placeholder="binro-images.pdf"
                className="min-h-[42px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30 disabled:bg-[#F3F6F7]"
              />
            </div>

            {/* Honest Size / Quality Note */}
            <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/70 px-3.5 py-2.5 text-xs leading-relaxed text-[#556168]">
              PDF embeds image data to keep text and details readable, so the
              finished PDF can be slightly larger than the source images.
            </p>

            {/* Truthful Progress Panel */}
            {isConverting && progress ? (
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
                  <span className="shrink-0 font-mono text-[#5C7E8F]">
                    Working
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#D4DDE2]">
                  <div className="h-full w-1/3 rounded-full bg-[#1CC8A0] animate-binro-indeterminate" />
                </div>
              </div>
            ) : null}

            {/* Result Ready vs Convert Action */}
            {resultState && isResultCurrent && !isConverting ? (
              <div
                aria-live="polite"
                className="space-y-4 border-t border-[#D4DDE2] pt-5"
              >
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0E6B56]">
                    PDF ready
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
                  <div>
                    <dt className="text-[#5C7E8F]">Pages</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultState.pageCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#5C7E8F]">PDF size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatFileBytes(resultState.outputSizeBytes)}
                    </dd>
                  </div>
                </dl>

                <p className="truncate text-xs text-[#556168]">
                  Output:{" "}
                  <span
                    title={sanitizedDownloadFilename}
                    className="font-mono text-[#20272B]"
                  >
                    {sanitizedDownloadFilename}
                  </span>
                </p>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[42px] w-full rounded-xl border border-[#D4DDE2] bg-white px-4 py-2 text-xs font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Create Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-[#D4DDE2]/80 pt-5">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="submit"
                    disabled={!canConvert}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isConverting ? "Converting..." : "Convert to PDF"}
                  </button>

                  <button
                    type="button"
                    disabled={isConverting}
                    onClick={handleReset}
                    className="min-h-[44px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2.5 text-sm font-medium text-[#556168] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Quiet Local Privacy Note */}
      <div className="flex items-center justify-between pt-1">
        <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-[#5C7E8F]" />
          <span>
            Your images are processed locally in your browser. They are not
            uploaded to BinRo servers.
          </span>
        </p>
      </div>
    </div>
  );
}

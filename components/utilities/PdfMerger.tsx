"use client";

import { useEffect, useRef, useState, type SVGProps } from "react";
import {
  inspectMergePdfFileInBrowser,
  mergePdfFilesInBrowser,
} from "@/lib/pdf/pdf-merge-client";
import {
  MAX_MERGE_FILES,
  MAX_SINGLE_PDF_BYTES,
  MAX_TOTAL_MERGE_BYTES,
  MergeSourceError,
  formatPdfBytes,
  sanitizeMergedPdfFilename,
  translateMergePdfError,
  validateMergeFileMetadata,
  type MergeProgress,
} from "@/lib/pdf/pdf-merge";

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

interface QueuedPdfFile {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  lastModified: number;
  pageCount: number | null;
  hasDigitalSignature: boolean;
  hasFormFields: boolean;
  fingerprint: string;
  validationError: string | null;
}

interface MergeResultState {
  downloadUrl: string;
  fileCount: number;
  totalPages: number;
  outputSizeBytes: number;
  hasAnyDigitalSignature: boolean;
  hasAnyFormFields: boolean;
}

const STAGE_LABELS: Record<MergeProgress["stage"], string> = {
  merging: "Merging files",
  generating: "Generating PDF",
  verifying: "Verifying PDF",
};

function createItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PdfMerger() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const activeCancelRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<number>(0);
  const isInspectingRef = useRef<boolean>(false);

  const [queuedFiles, setQueuedFiles] = useState<QueuedPdfFile[]>([]);
  const [outputFilenameInput, setOutputFilenameInput] =
    useState<string>("binro-merged.pdf");
  const [resultState, setResultState] = useState<MergeResultState | null>(null);
  const [isResultCurrent, setIsResultCurrent] = useState<boolean>(false);

  const [isDraggingUpload, setIsDraggingUpload] = useState<boolean>(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
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

  const addFiles = async (fileList: FileList | File[]) => {
    if (isInspectingRef.current || isMerging) return;
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const currentSession = sessionIdRef.current;
    const errors: string[] = [];
    const added: QueuedPdfFile[] = [];

    let runningCount = queuedFiles.length;
    let runningBytes = queuedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    const seenKeys = new Set(
      queuedFiles.map((f) => `${f.name}::${f.sizeBytes}::${f.lastModified}`)
    );
    const seenFingerprints = new Set(queuedFiles.map((f) => f.fingerprint));

    isInspectingRef.current = true;
    setIsInspecting(true);
    setErrorMessages([]);

    try {
      for (const file of incoming) {
        if (sessionIdRef.current !== currentSession) {
          return;
        }

        if (runningCount >= MAX_MERGE_FILES) {
          errors.push(
            `Skipped "${file.name}": You can combine up to ${MAX_MERGE_FILES} PDF files at once.`
          );
          continue;
        }

        const quickKey = `${file.name}::${file.size}::${file.lastModified}`;
        if (seenKeys.has(quickKey)) {
          errors.push(`"${file.name}" is already in your merge list.`);
          continue;
        }

        const metaError = validateMergeFileMetadata(file);
        if (metaError) {
          errors.push(metaError);
          continue;
        }

        if (runningBytes + file.size > MAX_TOTAL_MERGE_BYTES) {
          const maxTotalMb = Math.round(MAX_TOTAL_MERGE_BYTES / (1024 * 1024));
          errors.push(
            `Skipped "${file.name}": Total combined file size exceeds the ${maxTotalMb} MB browser limit.`
          );
          continue;
        }

        try {
          const inspection = await inspectMergePdfFileInBrowser(file);
          if (sessionIdRef.current !== currentSession) {
            return;
          }

          if (seenFingerprints.has(inspection.fingerprint)) {
            errors.push(
              `"${file.name}" matches a PDF that is already in your list.`
            );
            continue;
          }

          seenKeys.add(quickKey);
          seenFingerprints.add(inspection.fingerprint);
          runningCount += 1;
          runningBytes += file.size;

          added.push({
            id: createItemId(),
            file,
            name: file.name,
            sizeBytes: file.size,
            lastModified: file.lastModified,
            pageCount: inspection.pageCount,
            hasDigitalSignature: inspection.hasDigitalSignature,
            hasFormFields: inspection.hasFormFields,
            fingerprint: inspection.fingerprint,
            validationError: null,
          });
        } catch (err) {
          if (sessionIdRef.current !== currentSession) {
            return;
          }
          errors.push(translateMergePdfError(err, file.name));
        }
      }
    } finally {
      if (sessionIdRef.current === currentSession) {
        isInspectingRef.current = false;
        setIsInspecting(false);
      }
    }

    if (sessionIdRef.current !== currentSession) {
      return;
    }

    if (added.length > 0) {
      setQueuedFiles((prev) => [...prev, ...added]);
      setIsResultCurrent(false);
      setAnnouncement(
        `Added ${added.length} ${added.length === 1 ? "PDF file" : "PDF files"}.`
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
    // Ignore internal list item reordering drops or drops while busy
    if (draggedItemId || isInspectingRef.current || isInspecting || isMerging) {
      return;
    }
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (isMerging) return;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= queuedFiles.length ||
      toIndex >= queuedFiles.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const movedName = queuedFiles[fromIndex].name;
    setQueuedFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setIsResultCurrent(false);
    setErrorMessages([]);
    setAnnouncement(
      `Moved "${movedName}" to position ${toIndex + 1} of ${queuedFiles.length}.`
    );
  };

  const removeItem = (id: string) => {
    if (isMerging) return;
    const target = queuedFiles.find((item) => item.id === id);
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
    setIsResultCurrent(false);
    setErrorMessages([]);
    if (target) {
      setAnnouncement(`Removed "${target.name}".`);
    }
  };

  const handleReset = () => {
    sessionIdRef.current += 1;
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    revokeDownloadUrl();
    setQueuedFiles([]);
    setResultState(null);
    setIsResultCurrent(false);
    setOutputFilenameInput("binro-merged.pdf");
    isInspectingRef.current = false;
    setIsInspecting(false);
    setIsMerging(false);
    setProgress(null);
    setErrorMessages([]);
    setDraggedItemId(null);
    setDragOverItemId(null);
    setAnnouncement("Cleared all selected PDF files.");
  };

  const handleCancelMerge = () => {
    activeCancelRef.current?.();
    activeCancelRef.current = null;
    setIsMerging(false);
    setProgress(null);
    setAnnouncement("PDF merge cancelled.");
  };

  const handleMerge = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (isMerging || isInspecting) return;

    if (queuedFiles.length < 2) {
      setErrorMessages(["Select at least two valid PDF files to merge."]);
      return;
    }

    if (queuedFiles.some((f) => f.validationError !== null)) {
      setErrorMessages([
        "Remove or replace any file marked with an error before merging.",
      ]);
      return;
    }

    const currentSession = sessionIdRef.current;
    setErrorMessages([]);
    setIsMerging(true);
    setProgress({
      stage: "merging",
      percent: 0,
      detail: `Preparing ${queuedFiles.length} PDF files`,
    });

    const job = mergePdfFilesInBrowser(
      queuedFiles.map((item) => ({
        id: item.id,
        name: item.name,
        file: item.file,
      })),
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

      const copy = new Uint8Array(output.mergedBytes.byteLength);
      copy.set(output.mergedBytes);
      const blob = new Blob([copy], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      downloadUrlRef.current = downloadUrl;

      setResultState({
        downloadUrl,
        fileCount: output.fileCount,
        totalPages: output.totalPages,
        outputSizeBytes: output.outputSizeBytes,
        hasAnyDigitalSignature: output.hasAnyDigitalSignature,
        hasAnyFormFields: output.hasAnyFormFields,
      });
      setIsResultCurrent(true);
      setAnnouncement(
        `Merged ${output.fileCount} files into ${output.totalPages} pages.`
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

      if (error instanceof MergeSourceError) {
        setQueuedFiles((prev) =>
          prev.map((item) =>
            item.id === error.sourceId
              ? { ...item, validationError: error.message }
              : item
          )
        );
        setErrorMessages([error.message]);
      } else {
        setErrorMessages([translateMergePdfError(error)]);
      }
    } finally {
      if (sessionIdRef.current === currentSession) {
        setIsMerging(false);
        setProgress(null);
      }
    }
  };

  const sanitizedDownloadFilename =
    sanitizeMergedPdfFilename(outputFilenameInput);

  const handleDownload = () => {
    if (!resultState?.downloadUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultState.downloadUrl;
    anchor.download = sanitizedDownloadFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const hasInvalidQueuedFiles = queuedFiles.some(
    (f) => f.validationError !== null
  );
  const totalBytes = queuedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalPages = queuedFiles.reduce(
    (sum, f) => sum + (f.pageCount ?? 0),
    0
  );
  const hasAnySignature = queuedFiles.some((f) => f.hasDigitalSignature);
  const hasAnyForm = queuedFiles.some((f) => f.hasFormFields);
  const canMerge =
    queuedFiles.length >= 2 &&
    !isMerging &&
    !isInspecting &&
    !hasInvalidQueuedFiles;

  const maxPerFileMb = Math.round(MAX_SINGLE_PDF_BYTES / (1024 * 1024));
  const maxTotalMb = Math.round(MAX_TOTAL_MERGE_BYTES / (1024 * 1024));

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <input
        ref={fileInputRef}
        id="pdf-merger-file-input"
        type="file"
        accept="application/pdf,.pdf"
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

      {queuedFiles.length === 0 ? (
        /* Initial Clean Multi-File Upload Dropzone */
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
            className={`flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150 sm:min-h-[300px] sm:py-12 ${
              isDraggingUpload
                ? "border-[#426579] bg-[#F3F6F7]"
                : "border-[#D4DDE2] bg-[#F3F6F7]/50 hover:border-[#5C7E8F]"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#466677]">
              <PdfDocumentIcon className="h-6 w-6" />
            </div>

            <button
              type="button"
              disabled={isInspecting}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
            >
              {isInspecting ? "Validating PDFs..." : "Select PDF files"}
            </button>

            <p className="mt-3 text-sm text-[#556168]">
              or drop multiple PDFs here
            </p>
            <p className="mt-4 text-xs text-[#466677]">
              Up to {MAX_MERGE_FILES} PDFs · {maxPerFileMb} MB per file ·{" "}
              {maxTotalMb} MB total
            </p>
          </div>
        </div>
      ) : (
        /* Ordered File List + Merge Controls Workspace */
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
          className={`grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8 rounded-2xl transition-colors ${
            isDraggingUpload ? "ring-2 ring-[#5C7E8F]/40" : ""
          }`}
        >
          {/* Ordered PDF List */}
          <section
            aria-label="Selected PDF files in merge order"
            className="space-y-4 rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#20272B]">
                  Files to merge
                </h2>
                <p className="mt-0.5 font-mono text-xs text-[#466677] tabular-nums">
                  {queuedFiles.length}{" "}
                  {queuedFiles.length === 1 ? "file" : "files"} · {totalPages}{" "}
                  {totalPages === 1 ? "page" : "pages"} ·{" "}
                  {formatPdfBytes(totalBytes)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    isMerging ||
                    isInspecting ||
                    queuedFiles.length >= MAX_MERGE_FILES
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D4DDE2] bg-white px-3 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  <PlusIcon className="h-3.5 w-3.5 text-[#466677]" />
                  <span>{isInspecting ? "Adding..." : "Add PDFs"}</span>
                </button>
                <button
                  type="button"
                  disabled={isMerging}
                  onClick={handleReset}
                  className="min-h-[44px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Clear all
                </button>
              </div>
            </div>

            <ol className="divide-y divide-[#D4DDE2] rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/35">
              {queuedFiles.map((item, index) => {
                const isDragTarget =
                  dragOverItemId === item.id && draggedItemId !== item.id;
                const hasError = item.validationError !== null;

                return (
                  <li
                    key={item.id}
                    draggable={!isMerging}
                    onDragStart={(event) => {
                      if (isMerging) return;
                      setDraggedItemId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragOver={(event) => {
                      if (!draggedItemId || isMerging) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (dragOverItemId !== item.id) {
                        setDragOverItemId(item.id);
                      }
                    }}
                    onDrop={(event) => {
                      if (!draggedItemId || isMerging) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const fromIdx = queuedFiles.findIndex(
                        (f) => f.id === draggedItemId
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
                    className={`flex flex-col gap-2.5 px-3.5 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
                      hasError
                        ? "bg-[#FDF5F5]"
                        : isDragTarget
                          ? "bg-[#E9EFF2]"
                          : draggedItemId === item.id
                            ? "opacity-60"
                            : "bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                      <span
                        aria-hidden="true"
                        className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[#556168] sm:inline-flex"
                      >
                        <GripIcon className="h-4 w-4" />
                      </span>

                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3F6F7] font-mono text-xs font-medium text-[#426579] tabular-nums sm:mt-0">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          title={item.name}
                          className="truncate text-sm font-medium text-[#20272B]"
                        >
                          {item.name}
                        </p>
                        {hasError ? (
                          <p className="mt-0.5 text-xs text-[#7A2727]">
                            {item.validationError}
                          </p>
                        ) : (
                          <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                            {formatPdfBytes(item.sizeBytes)} ·{" "}
                            {item.pageCount !== null
                              ? `${item.pageCount} ${
                                  item.pageCount === 1 ? "page" : "pages"
                                }`
                              : "Pages pending"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1 pl-8 sm:pl-0">
                      <button
                        type="button"
                        disabled={index === 0 || isMerging}
                        onClick={() => moveItem(index, index - 1)}
                        aria-label={`Move ${item.name} up`}
                        title="Move up"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-35 disabled:hover:border-[#D4DDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:h-10 sm:w-10"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index === queuedFiles.length - 1 || isMerging
                        }
                        onClick={() => moveItem(index, index + 1)}
                        aria-label={`Move ${item.name} down`}
                        title="Move down"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#556168] transition-colors hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-35 disabled:hover:border-[#D4DDE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:h-10 sm:w-10"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isMerging}
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove file"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#556168] transition-colors hover:bg-[#FDF5F5] hover:text-[#7A2727] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:h-10 sm:w-10"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="text-xs text-[#556168]">
              Drag rows or use the up and down controls to set the exact page
              order. Drop additional PDFs anywhere here to append them.
            </p>
          </section>

          {/* Output Controls, Progress & Result */}
          <form
            onSubmit={handleMerge}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="merged-pdf-filename"
                className="block text-xs font-medium text-[#556168]"
              >
                Output filename
              </label>
              <input
                id="merged-pdf-filename"
                type="text"
                value={outputFilenameInput}
                disabled={isMerging}
                onChange={(event) => setOutputFilenameInput(event.target.value)}
                onBlur={() => {
                  if (!outputFilenameInput.trim()) {
                    setOutputFilenameInput("binro-merged.pdf");
                  }
                }}
                placeholder="binro-merged.pdf"
                className="min-h-[42px] w-full rounded-lg border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30 disabled:bg-[#F3F6F7]"
              />
              {outputFilenameInput.trim() &&
              outputFilenameInput.trim() !== sanitizedDownloadFilename ? (
                <p className="truncate text-xs text-[#466677]">
                  Will download as{" "}
                  <span className="font-mono text-[#20272B]">
                    {sanitizedDownloadFilename}
                  </span>
                </p>
              ) : null}
            </div>

            {hasAnySignature ? (
              <p className="rounded-xl border border-[#B47A3C]/40 bg-[#FDF9F3] px-3.5 py-2.5 text-xs leading-relaxed text-[#5D3D1A]">
                One or more selected PDFs contain a digital signature. Merging
                creates a new document and invalidates cryptographic signatures.
              </p>
            ) : null}

            {hasAnyForm ? (
              <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 px-3.5 py-2.5 text-xs leading-relaxed text-[#556168]">
                Interactive form fields or bookmarks from source PDFs may not be
                preserved identically across the combined file.
              </p>
            ) : null}

            {/* Honest Progress Panel */}
            {isMerging && progress ? (
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
                  <span className="shrink-0 font-mono text-[#466677] tabular-nums">
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
                    onClick={handleCancelMerge}
                    className="min-h-[36px] rounded-md px-2 text-xs font-medium text-[#556168] hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Merged Result Summary */}
            {resultState && isResultCurrent && !isMerging ? (
              <div
                aria-live="polite"
                className="space-y-4 border-t border-[#D4DDE2] pt-5"
              >
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0E6B56]">
                    Merged PDF ready
                  </p>
                </div>

                <dl className="grid grid-cols-3 gap-3 rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
                  <div>
                    <dt className="text-[#466677]">Files</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultState.fileCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#466677]">Pages</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {resultState.totalPages}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#466677]">Size</dt>
                    <dd className="mt-0.5 font-mono font-medium text-[#20272B] tabular-nums">
                      {formatPdfBytes(resultState.outputSizeBytes)}
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
                    Merge more PDFs
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-[#D4DDE2]/80 pt-5">
                {queuedFiles.length < 2 ? (
                  <p className="text-xs text-[#466677]">
                    Add at least one more PDF file to enable merging.
                  </p>
                ) : null}

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="submit"
                    disabled={!canMerge}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isMerging ? "Merging..." : "Merge PDFs"}
                  </button>

                  <button
                    type="button"
                    disabled={isMerging}
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

      {/* Quiet Privacy Line */}
      <div className="flex items-center justify-between pt-1">
        <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
          <LockIcon className="h-3.5 w-3.5 text-[#466677]" />
          <span>Your files are processed locally in your browser.</span>
        </p>
      </div>
    </div>
  );
}

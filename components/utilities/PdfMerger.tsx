"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  DownloadIcon,
  GripIcon,
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
          errors.push(`"${file.name}" is already in your document queue.`);
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
              `"${file.name}" matches a PDF that is already in your queue.`
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
      setErrorMessages(["Add at least two valid PDF files to merge."]);
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
      detail: `Combining ${queuedFiles.length} PDF files`,
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
        `Your merged PDF is ready: ${output.fileCount} files combined into ${output.totalPages} pages.`
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

      <ToolErrorBanner
        messages={errorMessages}
        onDismiss={() => setErrorMessages([])}
      />

      {queuedFiles.length === 0 ? (
        <ToolUploadDropzone
          icon={<PdfDocumentIcon className="h-6 w-6" />}
          buttonLabel="Select PDF files"
          busyLabel="Checking PDFs..."
          isBusy={isInspecting}
          isDragging={isDraggingUpload}
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
          onButtonClick={() => fileInputRef.current?.click()}
          helperText="or drop multiple PDFs here to arrange them in order"
          supportText={`Up to ${MAX_MERGE_FILES} PDFs · ${maxPerFileMb} MB per file · ${maxTotalMb} MB combined`}
        />
      ) : (
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
          className={`grid grid-cols-1 gap-6 rounded-2xl transition-colors lg:grid-cols-12 lg:items-start lg:gap-8 ${
            isDraggingUpload ? "ring-2 ring-[#5C7E8F]/45" : ""
          }`}
        >
          {/* Tactile Ordered Document Desk */}
          <section
            aria-label="PDF document order"
            className="space-y-4 rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#20272B]">
                  Document order (top to bottom)
                </h2>
                <p className="mt-0.5 font-mono text-xs text-[#466677] tabular-nums">
                  {queuedFiles.length}{" "}
                  {queuedFiles.length === 1 ? "document" : "documents"} ·{" "}
                  {totalPages} {totalPages === 1 ? "page" : "pages"} ·{" "}
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
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  <PlusIcon className="h-3.5 w-3.5 text-[#466677]" />
                  <span>{isInspecting ? "Adding..." : "Add more PDFs"}</span>
                </button>
                <button
                  type="button"
                  disabled={isMerging}
                  onClick={handleReset}
                  className="min-h-[42px] rounded-xl px-3 py-1.5 text-xs font-medium text-[#556168] transition-colors hover:bg-[#F3F6F7] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
                >
                  Clear all
                </button>
              </div>
            </div>

            <ol className="space-y-2.5">
              {queuedFiles.map((item, index) => {
                const isDragTarget =
                  dragOverItemId === item.id && draggedItemId !== item.id;
                const hasError = item.validationError !== null;
                const positionNote =
                  queuedFiles.length >= 2 && index === 0
                    ? "First"
                    : queuedFiles.length >= 2 &&
                        index === queuedFiles.length - 1
                      ? "Last"
                      : null;

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
                    className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-3.5 ${
                      hasError
                        ? "border-[#B44A4A]/50 bg-[#FDF5F5]"
                        : isDragTarget
                          ? "border-[#426579] bg-[#EAF0F3]"
                          : draggedItemId === item.id
                            ? "border-[#D4DDE2] bg-white opacity-60"
                            : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]/60"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="hidden h-9 w-5 shrink-0 cursor-grab items-center justify-center text-[#556168] sm:inline-flex"
                      >
                        <GripIcon className="h-4 w-4" />
                      </span>

                      {/* Document Thumbnail Motif with Order Badge */}
                      <div className="relative flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579]">
                        <PdfDocumentIcon className="h-5 w-5" />
                        <span className="mt-0.5 font-mono text-[10px] font-semibold leading-none tabular-nums">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            title={item.name}
                            className="truncate text-sm font-medium text-[#20272B]"
                          >
                            {item.name}
                          </p>
                          {positionNote ? (
                            <span className="shrink-0 text-[11px] font-medium text-[#466677]">
                              ({positionNote})
                            </span>
                          ) : null}
                        </div>

                        {hasError ? (
                          <p className="mt-0.5 text-xs text-[#7A2727]">
                            {item.validationError}
                          </p>
                        ) : (
                          <p className="mt-0.5 font-mono text-xs text-[#556168] tabular-nums">
                            {item.pageCount !== null
                              ? `${item.pageCount} ${
                                  item.pageCount === 1 ? "page" : "pages"
                                }`
                              : "Pages pending"}{" "}
                            · {formatPdfBytes(item.sizeBytes)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0 || isMerging}
                        onClick={() => moveItem(index, index - 1)}
                        aria-label={`Move ${item.name} earlier`}
                        title="Move earlier"
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
                        aria-label={`Move ${item.name} later`}
                        title="Move later"
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

            {/* Inline Drop / Append Cue */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#D4DDE2] bg-[#F3F6F7]/55 px-4 py-3 text-xs text-[#556168]">
              <span>
                Drag cards or use the arrows to arrange order. Drop more PDFs
                anywhere here to add them to the end.
              </span>
              {queuedFiles.length < MAX_MERGE_FILES ? (
                <button
                  type="button"
                  disabled={isMerging || isInspecting}
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Browse PDFs
                </button>
              ) : null}
            </div>
          </section>

          {/* Output Controls, Progress & Result */}
          <form
            onSubmit={handleMerge}
            className="space-y-5 rounded-2xl border border-[#D4DDE2] bg-white p-5 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6 lg:col-span-5"
          >
            {/* Combined Summary Box */}
            <div className="rounded-xl bg-[#F3F6F7] p-3.5 text-xs">
              <p className="font-medium text-[#466677]">Combined output</p>
              <p className="mt-1 font-mono text-sm font-semibold text-[#20272B] tabular-nums">
                {queuedFiles.length}{" "}
                {queuedFiles.length === 1 ? "PDF" : "PDFs"} → 1 document (
                {totalPages} {totalPages === 1 ? "page" : "pages"})
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="merged-pdf-filename"
                className="block text-xs font-semibold text-[#20272B]"
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
                className="min-h-[44px] w-full rounded-xl border border-[#D4DDE2] bg-white px-3 py-2 font-mono text-sm text-[#20272B] focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30 disabled:bg-[#F3F6F7]"
              />
              {outputFilenameInput.trim() &&
              outputFilenameInput.trim() !== sanitizedDownloadFilename ? (
                <p className="truncate text-xs text-[#466677]">
                  Saves as{" "}
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

            {isMerging && progress ? (
              <ToolProgressCard
                stageLabel={STAGE_LABELS[progress.stage]}
                detail={progress.detail}
                percent={progress.percent}
                onCancel={handleCancelMerge}
              />
            ) : null}

            {resultState && isResultCurrent && !isMerging ? (
              <div
                aria-live="polite"
                className="space-y-4 border-t border-[#D4DDE2] pt-5"
              >
                <ToolResultHeader title="Your merged PDF is ready" />

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
                  Filename:{" "}
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
                    <span>Download merged PDF</span>
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
                  <p className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 px-3.5 py-2.5 text-xs text-[#466677]">
                    Add at least one more PDF file on the left to combine them.
                  </p>
                ) : null}

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="submit"
                    disabled={!canMerge}
                    className="min-h-[46px] flex-1 rounded-xl bg-[#426579] px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    {isMerging ? "Merging PDFs..." : "Merge PDFs"}
                  </button>

                  <button
                    type="button"
                    disabled={isMerging}
                    onClick={handleReset}
                    className="min-h-[44px] rounded-xl border border-[#D4DDE2] bg-white px-4 py-2.5 text-sm font-medium text-[#556168] transition-colors duration-150 hover:border-[#5C7E8F] hover:text-[#20272B] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <ToolPrivacyNote text="Your PDFs stay on your device and are combined locally in your browser." />
    </div>
  );
}

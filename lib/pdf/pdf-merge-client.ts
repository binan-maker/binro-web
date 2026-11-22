"use client";

import {
  MergeSourceError,
  inspectPdfForMerge,
  mergePdfSources,
  translateMergePdfError,
  type MergePdfResult,
  type MergeProgress,
  type PdfMergeInspection,
} from "./pdf-merge";

const INSPECT_TIMEOUT_MS = 30_000;
const MERGE_INACTIVITY_TIMEOUT_MS = 45_000;
const MERGE_MAX_TIMEOUT_MS = 180_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

export async function inspectMergePdfFileInBrowser(
  file: File
): Promise<PdfMergeInspection> {
  const inspectOnMainThread = async () => {
    const buffer = await file.arrayBuffer();
    return withTimeout(
      inspectPdfForMerge(new Uint8Array(buffer), file.name),
      INSPECT_TIMEOUT_MS
    );
  };

  if (!canUseWorker()) {
    try {
      return await inspectOnMainThread();
    } catch (error) {
      throw new Error(translateMergePdfError(error, file.name));
    }
  }

  return new Promise<PdfMergeInspection>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./pdf-merge.worker.ts", import.meta.url)
      );
    } catch {
      inspectOnMainThread()
        .then(resolve)
        .catch((err) => reject(new Error(translateMergePdfError(err, file.name))));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(
        new Error(
          `"${file.name}": Reading this PDF took too long. Please check that it is valid.`
        )
      );
    }, INSPECT_TIMEOUT_MS);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      fn();
    };

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === "inspect-result") {
        finish(() => resolve(msg.info as PdfMergeInspection));
      } else if (msg.type === "error") {
        finish(() => reject(new Error(msg.message)));
      }
    };

    worker.onmessageerror = () => {
      finish(() =>
        reject(
          new Error(`"${file.name}": Could not inspect this PDF in the browser worker.`)
        )
      );
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      inspectOnMainThread()
        .then(resolve)
        .catch((err) => reject(new Error(translateMergePdfError(err, file.name))));
    };

    worker.postMessage({ id: 1, action: "inspect", file });
  });
}

export function mergePdfFilesInBrowser(
  items: Array<{ id: string; name: string; file: File }>,
  onProgress?: (progress: MergeProgress) => void
): {
  promise: Promise<MergePdfResult>;
  cancel: () => void;
} {
  let activeWorker: Worker | null = null;
  let cancelled = false;
  const abortController = new AbortController();
  let rejectPending: ((reason?: unknown) => void) | null = null;
  let cleanupTimers: (() => void) | null = null;

  const cancel = () => {
    cancelled = true;
    abortController.abort();
    cleanupTimers?.();
    cleanupTimers = null;
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }
    if (rejectPending) {
      const rejectFn = rejectPending;
      rejectPending = null;
      rejectFn(new Error("Merge cancelled."));
    }
  };

  const runOnMainThread = async (): Promise<MergePdfResult> => {
    return mergePdfSources(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        bytes: async () => new Uint8Array(await item.file.arrayBuffer()),
      })),
      onProgress,
      abortController.signal
    );
  };

  const promise = (async () => {
    if (cancelled) {
      throw new Error("Merge cancelled.");
    }

    if (!canUseWorker()) {
      try {
        return await runOnMainThread();
      } catch (error) {
        if (error instanceof MergeSourceError) {
          throw error;
        }
        throw new Error(translateMergePdfError(error));
      }
    }

    return new Promise<MergePdfResult>((resolve, reject) => {
      let settled = false;
      let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
      let maxTimer: ReturnType<typeof setTimeout> | null = null;

      const clearAllTimers = () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          inactivityTimer = null;
        }
        if (maxTimer) {
          clearTimeout(maxTimer);
          maxTimer = null;
        }
      };

      cleanupTimers = clearAllTimers;
      rejectPending = (err) => {
        if (settled) return;
        settled = true;
        clearAllTimers();
        reject(err);
      };

      const failWithTimeout = (message: string) => {
        if (settled || cancelled) return;
        settled = true;
        rejectPending = null;
        clearAllTimers();
        activeWorker?.terminate();
        activeWorker = null;
        reject(new Error(message));
      };

      const resetInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          failWithTimeout(
            "PDF merging stopped responding while processing these documents. Please try again with fewer or smaller files."
          );
        }, MERGE_INACTIVITY_TIMEOUT_MS);
      };

      try {
        activeWorker = new Worker(
          new URL("./pdf-merge.worker.ts", import.meta.url)
        );
      } catch {
        clearAllTimers();
        rejectPending = null;
        runOnMainThread()
          .then(resolve)
          .catch((err) => {
            if (err instanceof MergeSourceError) {
              reject(err);
            } else {
              reject(new Error(translateMergePdfError(err)));
            }
          });
        return;
      }

      maxTimer = setTimeout(() => {
        failWithTimeout(
          "PDF merging exceeded the browser processing time limit. Please try splitting into smaller batches."
        );
      }, MERGE_MAX_TIMEOUT_MS);
      resetInactivityTimer();

      activeWorker.onmessage = (event: MessageEvent) => {
        if (settled || cancelled) {
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;
          return;
        }

        const msg = event.data;
        if (msg.type === "progress") {
          resetInactivityTimer();
          onProgress?.(msg.progress as MergeProgress);
        } else if (msg.type === "merge-result") {
          settled = true;
          rejectPending = null;
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;
          const mergedBytes = new Uint8Array(msg.mergedBuffer as ArrayBuffer);
          resolve({
            mergedBytes,
            fileCount: msg.result.fileCount,
            totalPages: msg.result.totalPages,
            outputSizeBytes: msg.result.outputSizeBytes,
            hasAnyDigitalSignature: msg.result.hasAnyDigitalSignature,
            hasAnyFormFields: msg.result.hasAnyFormFields,
          });
        } else if (msg.type === "error") {
          settled = true;
          rejectPending = null;
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;
          if (msg.sourceId && msg.sourceName) {
            reject(
              new MergeSourceError(msg.sourceId, msg.sourceName, msg.message)
            );
          } else {
            reject(new Error(msg.message));
          }
        }
      };

      activeWorker.onmessageerror = () => {
        if (settled || cancelled) return;
        settled = true;
        rejectPending = null;
        clearAllTimers();
        activeWorker?.terminate();
        activeWorker = null;
        reject(
          new Error("Unable to read merged PDF from browser worker. Please try again.")
        );
      };

      activeWorker.onerror = () => {
        if (settled || cancelled) return;
        clearAllTimers();
        activeWorker?.terminate();
        activeWorker = null;
        runOnMainThread()
          .then((res) => {
            if (settled) return;
            settled = true;
            rejectPending = null;
            resolve(res);
          })
          .catch((err) => {
            if (settled) return;
            settled = true;
            rejectPending = null;
            if (err instanceof MergeSourceError) {
              reject(err);
            } else {
              reject(new Error(translateMergePdfError(err)));
            }
          });
      };

      activeWorker.postMessage({
        id: 1,
        action: "merge",
        items,
      });
    });
  })();

  return { promise, cancel };
}

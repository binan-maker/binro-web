"use client";

import {
  inspectPdfForSplit,
  splitPdfBytes,
  translateSplitPdfError,
  type PdfSplitInspection,
  type SplitOutputFile,
  type SplitOutputPlan,
  type SplitPdfResult,
  type SplitProgress,
} from "./pdf-split";

const INSPECT_TIMEOUT_MS = 30_000;
const SPLIT_INACTIVITY_TIMEOUT_MS = 45_000;
const SPLIT_MAX_TIMEOUT_MS = 180_000;

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

export async function inspectSplitPdfFileInBrowser(
  file: File
): Promise<PdfSplitInspection> {
  const inspectOnMainThread = async () => {
    const buffer = await file.arrayBuffer();
    return withTimeout(
      inspectPdfForSplit(new Uint8Array(buffer)),
      INSPECT_TIMEOUT_MS
    );
  };

  if (!canUseWorker()) {
    try {
      return await inspectOnMainThread();
    } catch (error) {
      throw new Error(translateSplitPdfError(error));
    }
  }

  return new Promise<PdfSplitInspection>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./pdf-split.worker.ts", import.meta.url)
      );
    } catch {
      inspectOnMainThread()
        .then(resolve)
        .catch((err) => reject(new Error(translateSplitPdfError(err))));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(
        new Error(
          "Reading this PDF took too long. Please check that the file is valid."
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
        finish(() => resolve(msg.info as PdfSplitInspection));
      } else if (msg.type === "error") {
        finish(() => reject(new Error(msg.message)));
      }
    };

    worker.onmessageerror = () => {
      finish(() =>
        reject(
          new Error("Could not read this PDF in the browser worker. Please try again.")
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
        .catch((err) => reject(new Error(translateSplitPdfError(err))));
    };

    worker.postMessage({ id: 1, action: "inspect", file });
  });
}

export function splitPdfFileInBrowser(
  file: File,
  plans: SplitOutputPlan[],
  sourceFilename: string,
  onProgress?: (progress: SplitProgress) => void
): {
  promise: Promise<SplitPdfResult>;
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
      rejectFn(new Error("Split cancelled."));
    }
  };

  const runOnMainThread = async (): Promise<SplitPdfResult> => {
    const buffer = await file.arrayBuffer();
    if (cancelled) throw new Error("Split cancelled.");
    return splitPdfBytes(
      new Uint8Array(buffer),
      plans,
      sourceFilename,
      onProgress,
      abortController.signal
    );
  };

  const promise = (async () => {
    if (cancelled) {
      throw new Error("Split cancelled.");
    }

    if (!canUseWorker()) {
      try {
        return await runOnMainThread();
      } catch (error) {
        throw new Error(translateSplitPdfError(error));
      }
    }

    return new Promise<SplitPdfResult>((resolve, reject) => {
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
            "PDF splitting stopped responding while processing this document. Please try again."
          );
        }, SPLIT_INACTIVITY_TIMEOUT_MS);
      };

      try {
        activeWorker = new Worker(
          new URL("./pdf-split.worker.ts", import.meta.url)
        );
      } catch {
        clearAllTimers();
        rejectPending = null;
        runOnMainThread()
          .then(resolve)
          .catch((err) => reject(new Error(translateSplitPdfError(err))));
        return;
      }

      maxTimer = setTimeout(() => {
        failWithTimeout(
          "PDF splitting exceeded the browser processing time limit. Please try splitting fewer pages at once."
        );
      }, SPLIT_MAX_TIMEOUT_MS);
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
          onProgress?.(msg.progress as SplitProgress);
        } else if (msg.type === "split-result") {
          settled = true;
          rejectPending = null;
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;

          const outputs: SplitOutputFile[] = (
            msg.outputs as Array<{
              id: string;
              filename: string;
              pages: number[];
              pageCount: number;
              rangeLabel: string;
              sizeBytes: number;
              buffer: ArrayBuffer;
            }>
          ).map((item) => ({
            id: item.id,
            filename: item.filename,
            pages: item.pages,
            pageCount: item.pageCount,
            rangeLabel: item.rangeLabel,
            sizeBytes: item.sizeBytes,
            bytes: new Uint8Array(item.buffer),
          }));

          const zipBytes = msg.zipBuffer
            ? new Uint8Array(msg.zipBuffer as ArrayBuffer)
            : null;

          resolve({
            outputs,
            zipBytes,
            zipFilename: msg.zipFilename as string | null,
            sourcePageCount: msg.sourcePageCount as number,
            hasDigitalSignature: msg.hasDigitalSignature as boolean,
            hasFormFields: msg.hasFormFields as boolean,
            hasLinks: msg.hasLinks as boolean,
            hasOutlines: msg.hasOutlines as boolean,
          });
        } else if (msg.type === "error") {
          settled = true;
          rejectPending = null;
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;
          reject(new Error(msg.message));
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
          new Error("Unable to read split output from browser worker. Please try again.")
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
            reject(new Error(translateSplitPdfError(err)));
          });
      };

      activeWorker.postMessage({
        id: 1,
        action: "split",
        file,
        plans,
        sourceFilename,
      });
    });
  })();

  return { promise, cancel };
}

"use client";

import {
  compressPdfBytes,
  inspectPdfBytes,
  translatePdfError,
  type CompressPdfOptions,
  type CompressPdfOutput,
  type CompressionProgress,
  type ImageReencoder,
  type PdfInspectionResult,
} from "./pdf-compression";

const IMAGE_OPERATION_TIMEOUT_MS = 15_000;
const INSPECT_TIMEOUT_MS = 30_000;
const COMPRESS_INACTIVITY_TIMEOUT_MS = 45_000;
const COMPRESS_MAX_TIMEOUT_MS = 180_000;

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

const reencodeOnMainThread: ImageReencoder = async ({
  kind,
  bytes,
  width,
  height,
  maxEdge,
  quality,
}) => {
  if (typeof document === "undefined") return null;
  if (width <= 0 || height <= 0 || bytes.byteLength === 0) return null;

  let outWidth = width;
  let outHeight = height;
  if (maxEdge && Math.max(width, height) > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    outWidth = Math.max(1, Math.round(width * scale));
    outHeight = Math.max(1, Math.round(height * scale));
  }

  let objectUrl: string | null = null;
  const srcCanvas = document.createElement("canvas");
  const dstCanvas = document.createElement("canvas");

  try {
    if (kind === "jpeg") {
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy], { type: "image/jpeg" });
      objectUrl = URL.createObjectURL(blob);

      const img = await withTimeout(
        new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("Image decode error"));
          el.src = objectUrl!;
        }),
        IMAGE_OPERATION_TIMEOUT_MS
      );

      dstCanvas.width = outWidth;
      dstCanvas.height = outHeight;
      const ctx = dstCanvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, outWidth, outHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, outWidth, outHeight);
    } else {
      srcCanvas.width = width;
      srcCanvas.height = height;
      const srcCtx = srcCanvas.getContext("2d");
      if (!srcCtx) return null;
      const clamped = new Uint8ClampedArray(bytes.byteLength);
      clamped.set(bytes);
      srcCtx.putImageData(new ImageData(clamped, width, height), 0, 0);

      dstCanvas.width = outWidth;
      dstCanvas.height = outHeight;
      const dstCtx = dstCanvas.getContext("2d");
      if (!dstCtx) return null;
      dstCtx.fillStyle = "#FFFFFF";
      dstCtx.fillRect(0, 0, outWidth, outHeight);
      dstCtx.imageSmoothingEnabled = true;
      dstCtx.imageSmoothingQuality = "high";
      dstCtx.drawImage(srcCanvas, 0, 0, outWidth, outHeight);
    }

    const outBlob = await withTimeout(
      new Promise<Blob | null>((resolve) =>
        dstCanvas.toBlob(resolve, "image/jpeg", quality)
      ),
      IMAGE_OPERATION_TIMEOUT_MS
    );
    if (!outBlob) return null;
    const outBuf = await withTimeout(
      outBlob.arrayBuffer(),
      IMAGE_OPERATION_TIMEOUT_MS
    );
    return {
      jpegBytes: new Uint8Array(outBuf),
      width: outWidth,
      height: outHeight,
    };
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    srcCanvas.width = 0;
    srcCanvas.height = 0;
    dstCanvas.width = 0;
    dstCanvas.height = 0;
  }
};

function canUseWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined"
  );
}

export async function inspectPdfFileInBrowser(
  file: File
): Promise<PdfInspectionResult> {
  const buffer = await file.arrayBuffer();

  if (!canUseWorker()) {
    try {
      return await withTimeout(
        inspectPdfBytes(new Uint8Array(buffer)),
        INSPECT_TIMEOUT_MS
      );
    } catch (error) {
      throw new Error(translatePdfError(error));
    }
  }

  return new Promise<PdfInspectionResult>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./pdf-compression.worker.ts", import.meta.url)
      );
    } catch {
      withTimeout(inspectPdfBytes(new Uint8Array(buffer)), INSPECT_TIMEOUT_MS)
        .then(resolve)
        .catch((err) => reject(new Error(translatePdfError(err))));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(
        new Error(
          "Reading this PDF took too long. Please check the file or try another document."
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
        finish(() => resolve(msg.info as PdfInspectionResult));
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
      void file
        .arrayBuffer()
        .then((buf) =>
          withTimeout(inspectPdfBytes(new Uint8Array(buf)), INSPECT_TIMEOUT_MS)
        )
        .then(resolve)
        .catch((err) => reject(new Error(translatePdfError(err))));
    };

    worker.postMessage({ id: 1, action: "inspect", buffer }, [buffer]);
  });
}

export function compressPdfFileInBrowser(
  file: File,
  options: CompressPdfOptions,
  onProgress?: (progress: CompressionProgress) => void
): {
  promise: Promise<CompressPdfOutput>;
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
      rejectFn(new Error("Compression cancelled."));
    }
  };

  const promise = (async () => {
    const buffer = await file.arrayBuffer();
    if (cancelled) {
      throw new Error("Compression cancelled.");
    }

    if (!canUseWorker()) {
      try {
        return await compressPdfBytes(
          new Uint8Array(buffer),
          options,
          reencodeOnMainThread,
          onProgress,
          abortController.signal
        );
      } catch (error) {
        throw new Error(translatePdfError(error));
      }
    }

    return new Promise<CompressPdfOutput>((resolve, reject) => {
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
            "PDF compression stopped responding while processing this document. Please try again."
          );
        }, COMPRESS_INACTIVITY_TIMEOUT_MS);
      };

      try {
        activeWorker = new Worker(
          new URL("./pdf-compression.worker.ts", import.meta.url)
        );
      } catch {
        clearAllTimers();
        rejectPending = null;
        compressPdfBytes(
          new Uint8Array(buffer),
          options,
          reencodeOnMainThread,
          onProgress,
          abortController.signal
        )
          .then(resolve)
          .catch((err) => reject(new Error(translatePdfError(err))));
        return;
      }

      maxTimer = setTimeout(() => {
        failWithTimeout(
          "PDF compression exceeded the browser processing time limit. Please try again with a smaller file."
        );
      }, COMPRESS_MAX_TIMEOUT_MS);
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
          onProgress?.(msg.progress as CompressionProgress);
        } else if (msg.type === "compress-result") {
          settled = true;
          rejectPending = null;
          clearAllTimers();
          activeWorker?.terminate();
          activeWorker = null;
          const result = msg.result as CompressPdfOutput;
          const compressedBytes = msg.compressedBuffer
            ? new Uint8Array(msg.compressedBuffer as ArrayBuffer)
            : null;
          resolve({ ...result, compressedBytes });
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
          new Error("Unable to read compression output from worker. Please try again.")
        );
      };

      activeWorker.onerror = () => {
        if (settled || cancelled) return;
        clearAllTimers();
        activeWorker?.terminate();
        activeWorker = null;
        void file
          .arrayBuffer()
          .then((fallbackBuf) => {
            if (cancelled) throw new Error("Compression cancelled.");
            return compressPdfBytes(
              new Uint8Array(fallbackBuf),
              options,
              reencodeOnMainThread,
              onProgress,
              abortController.signal
            );
          })
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
            reject(new Error(translatePdfError(err)));
          });
      };

      activeWorker.postMessage(
        { id: 1, action: "compress", buffer, options },
        [buffer]
      );
    });
  })();

  return { promise, cancel };
}

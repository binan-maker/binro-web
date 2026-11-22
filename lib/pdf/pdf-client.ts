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

const reencodeOnMainThread: ImageReencoder = async ({
  kind,
  bytes,
  width,
  height,
  maxEdge,
  quality,
}) => {
  if (typeof document === "undefined") return null;

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

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image decode error"));
        el.src = objectUrl!;
      });

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

    const outBlob = await new Promise<Blob | null>((resolve) =>
      dstCanvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!outBlob) return null;
    const outBytes = new Uint8Array(await outBlob.arrayBuffer());
    return { jpegBytes: outBytes, width: outWidth, height: outHeight };
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
      return await inspectPdfBytes(new Uint8Array(buffer));
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
      inspectPdfBytes(new Uint8Array(buffer))
        .then(resolve)
        .catch((err) => reject(new Error(translatePdfError(err))));
      return;
    }

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === "inspect-result") {
        worker.terminate();
        resolve(msg.info as PdfInspectionResult);
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      void file
        .arrayBuffer()
        .then((buf) => inspectPdfBytes(new Uint8Array(buf)))
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

  const cancel = () => {
    cancelled = true;
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
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
          onProgress
        );
      } catch (error) {
        throw new Error(translatePdfError(error));
      }
    }

    return new Promise<CompressPdfOutput>((resolve, reject) => {
      try {
        activeWorker = new Worker(
          new URL("./pdf-compression.worker.ts", import.meta.url)
        );
      } catch {
        compressPdfBytes(
          new Uint8Array(buffer),
          options,
          reencodeOnMainThread,
          onProgress
        )
          .then(resolve)
          .catch((err) => reject(new Error(translatePdfError(err))));
        return;
      }

      activeWorker.onmessage = (event: MessageEvent) => {
        if (cancelled) {
          activeWorker?.terminate();
          activeWorker = null;
          return;
        }
        const msg = event.data;
        if (msg.type === "progress") {
          onProgress?.(msg.progress as CompressionProgress);
        } else if (msg.type === "compress-result") {
          activeWorker?.terminate();
          activeWorker = null;
          const result = msg.result as CompressPdfOutput;
          const compressedBytes = msg.compressedBuffer
            ? new Uint8Array(msg.compressedBuffer as ArrayBuffer)
            : null;
          resolve({ ...result, compressedBytes });
        } else if (msg.type === "error") {
          activeWorker?.terminate();
          activeWorker = null;
          reject(new Error(msg.message));
        }
      };

      activeWorker.onerror = () => {
        activeWorker?.terminate();
        activeWorker = null;
        if (cancelled) return;
        void file
          .arrayBuffer()
          .then((fallbackBuf) =>
            compressPdfBytes(
              new Uint8Array(fallbackBuf),
              options,
              reencodeOnMainThread,
              onProgress
            )
          )
          .then(resolve)
          .catch((err) => reject(new Error(translatePdfError(err))));
      };

      activeWorker.postMessage(
        { id: 1, action: "compress", buffer, options },
        [buffer]
      );
    });
  })();

  return { promise, cancel };
}

import {
  compressPdfBytes,
  inspectPdfBytes,
  translatePdfError,
  type CompressPdfOptions,
  type ImageReencoder,
} from "./pdf-compression";

const reencodeInWorker: ImageReencoder = async ({
  kind,
  bytes,
  width,
  height,
  maxEdge,
  quality,
}) => {
  if (typeof OffscreenCanvas === "undefined") {
    return null;
  }

  let outWidth = width;
  let outHeight = height;
  if (maxEdge && Math.max(width, height) > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    outWidth = Math.max(1, Math.round(width * scale));
    outHeight = Math.max(1, Math.round(height * scale));
  }

  let bitmap: ImageBitmap | null = null;

  try {
    if (kind === "jpeg") {
      if (typeof createImageBitmap !== "function") return null;
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy], { type: "image/jpeg" });
      bitmap = await createImageBitmap(blob);

      const canvas = new OffscreenCanvas(outWidth, outHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, outWidth, outHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, outWidth, outHeight);

      const outBlob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality,
      });
      const outBytes = new Uint8Array(await outBlob.arrayBuffer());
      canvas.width = 0;
      canvas.height = 0;
      return { jpegBytes: outBytes, width: outWidth, height: outHeight };
    }

    // Raw RGBA pixel buffer
    const srcCanvas = new OffscreenCanvas(width, height);
    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) return null;

    const clamped = new Uint8ClampedArray(bytes.byteLength);
    clamped.set(bytes);
    const imageData = new ImageData(clamped, width, height);
    srcCtx.putImageData(imageData, 0, 0);

    const dstCanvas =
      outWidth === width && outHeight === height
        ? srcCanvas
        : new OffscreenCanvas(outWidth, outHeight);

    if (dstCanvas !== srcCanvas) {
      const dstCtx = dstCanvas.getContext("2d");
      if (!dstCtx) return null;
      dstCtx.fillStyle = "#FFFFFF";
      dstCtx.fillRect(0, 0, outWidth, outHeight);
      dstCtx.imageSmoothingEnabled = true;
      dstCtx.imageSmoothingQuality = "high";
      dstCtx.drawImage(srcCanvas, 0, 0, outWidth, outHeight);
      srcCanvas.width = 0;
      srcCanvas.height = 0;
    }

    const outBlob = await dstCanvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });
    const outBytes = new Uint8Array(await outBlob.arrayBuffer());
    dstCanvas.width = 0;
    dstCanvas.height = 0;
    return { jpegBytes: outBytes, width: outWidth, height: outHeight };
  } catch {
    return null;
  } finally {
    if (bitmap) {
      bitmap.close();
    }
  }
};

type WorkerRequest =
  | { id: number; action: "inspect"; buffer: ArrayBuffer }
  | {
      id: number;
      action: "compress";
      buffer: ArrayBuffer;
      options: CompressPdfOptions;
    };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.action === "inspect") {
      const bytes = new Uint8Array(msg.buffer);
      const info = await inspectPdfBytes(bytes);
      self.postMessage({ id: msg.id, type: "inspect-result", info });
      return;
    }

    if (msg.action === "compress") {
      const bytes = new Uint8Array(msg.buffer);
      const result = await compressPdfBytes(
        bytes,
        msg.options,
        reencodeInWorker,
        (progress) => {
          self.postMessage({ id: msg.id, type: "progress", progress });
        }
      );

      if (result.compressedBytes) {
        const outBuf = result.compressedBytes.buffer.slice(
          result.compressedBytes.byteOffset,
          result.compressedBytes.byteOffset + result.compressedBytes.byteLength
        ) as ArrayBuffer;
        self.postMessage(
          {
            id: msg.id,
            type: "compress-result",
            result: { ...result, compressedBytes: null },
            compressedBuffer: outBuf,
          },
          { transfer: [outBuf] }
        );
      } else {
        self.postMessage({
          id: msg.id,
          type: "compress-result",
          result,
          compressedBuffer: null,
        });
      }
    }
  } catch (error) {
    self.postMessage({
      id: msg.id,
      type: "error",
      message: translatePdfError(error),
    });
  }
};

import {
  MergeSourceError,
  inspectPdfForMerge,
  mergePdfSources,
  translateMergePdfError,
} from "./pdf-merge";

type WorkerRequest =
  | { id: number; action: "inspect"; file: File }
  | {
      id: number;
      action: "merge";
      items: Array<{ id: string; name: string; file: File }>;
    };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.action === "inspect") {
      const buffer = await msg.file.arrayBuffer();
      const info = await inspectPdfForMerge(
        new Uint8Array(buffer),
        msg.file.name
      );
      self.postMessage({ id: msg.id, type: "inspect-result", info });
      return;
    }

    if (msg.action === "merge") {
      const result = await mergePdfSources(
        msg.items.map((item) => ({
          id: item.id,
          name: item.name,
          bytes: async () => new Uint8Array(await item.file.arrayBuffer()),
        })),
        (progress) => {
          self.postMessage({ id: msg.id, type: "progress", progress });
        }
      );

      const outBuf = result.mergedBytes.buffer.slice(
        result.mergedBytes.byteOffset,
        result.mergedBytes.byteOffset + result.mergedBytes.byteLength
      ) as ArrayBuffer;

      self.postMessage(
        {
          id: msg.id,
          type: "merge-result",
          result: {
            fileCount: result.fileCount,
            totalPages: result.totalPages,
            outputSizeBytes: result.outputSizeBytes,
            hasAnyDigitalSignature: result.hasAnyDigitalSignature,
            hasAnyFormFields: result.hasAnyFormFields,
          },
          mergedBuffer: outBuf,
        },
        { transfer: [outBuf] }
      );
    }
  } catch (error) {
    if (error instanceof MergeSourceError) {
      self.postMessage({
        id: msg.id,
        type: "error",
        message: error.message,
        sourceId: error.sourceId,
        sourceName: error.sourceName,
      });
      return;
    }

    self.postMessage({
      id: msg.id,
      type: "error",
      message: translateMergePdfError(error),
    });
  }
};

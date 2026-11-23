import {
  inspectPdfForSplit,
  splitPdfBytes,
  translateSplitPdfError,
  type SplitOutputPlan,
} from "./pdf-split";

type WorkerRequest =
  | { id: number; action: "inspect"; file: File }
  | {
      id: number;
      action: "split";
      file: File;
      plans: SplitOutputPlan[];
      sourceFilename: string;
    };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.action === "inspect") {
      const buffer = await msg.file.arrayBuffer();
      const info = await inspectPdfForSplit(new Uint8Array(buffer));
      self.postMessage({ id: msg.id, type: "inspect-result", info });
      return;
    }

    if (msg.action === "split") {
      const buffer = await msg.file.arrayBuffer();
      const result = await splitPdfBytes(
        new Uint8Array(buffer),
        msg.plans,
        msg.sourceFilename,
        (progress) => {
          self.postMessage({ id: msg.id, type: "progress", progress });
        }
      );

      const transferBuffers: ArrayBuffer[] = [];
      const serializedOutputs = result.outputs.map((item) => {
        const outBuf = item.bytes.buffer.slice(
          item.bytes.byteOffset,
          item.bytes.byteOffset + item.bytes.byteLength
        ) as ArrayBuffer;
        transferBuffers.push(outBuf);
        return {
          id: item.id,
          filename: item.filename,
          pages: item.pages,
          pageCount: item.pageCount,
          rangeLabel: item.rangeLabel,
          sizeBytes: item.sizeBytes,
          buffer: outBuf,
        };
      });

      let zipBuffer: ArrayBuffer | null = null;
      if (result.zipBytes) {
        zipBuffer = result.zipBytes.buffer.slice(
          result.zipBytes.byteOffset,
          result.zipBytes.byteOffset + result.zipBytes.byteLength
        ) as ArrayBuffer;
        transferBuffers.push(zipBuffer);
      }

      self.postMessage(
        {
          id: msg.id,
          type: "split-result",
          outputs: serializedOutputs,
          zipBuffer,
          zipFilename: result.zipFilename,
          sourcePageCount: result.sourcePageCount,
          hasDigitalSignature: result.hasDigitalSignature,
          hasFormFields: result.hasFormFields,
          hasLinks: result.hasLinks,
          hasOutlines: result.hasOutlines,
        },
        { transfer: transferBuffers }
      );
    }
  } catch (error) {
    self.postMessage({
      id: msg.id,
      type: "error",
      message: translateSplitPdfError(error),
    });
  }
};

"use client";

import {
  ToolHelpAccordion,
  type ToolHelpItem,
} from "@/components/utilities/ToolUI";

const PDF_HELP_ITEMS: ToolHelpItem[] = [
  {
    id: "how-it-works",
    question: "How PDF compression works",
    answer:
      "BinRo PDF Compressor compacts PDF object streams, removes unnecessary embedded page thumbnails, compresses uncompressed streams, and optimises embedded raster images inside the document. Selectable text, vector graphics, page order, and links remain intact.",
  },
  {
    id: "target-size",
    question: "How to choose a target size",
    answer:
      "Use Recommended mode for general documents. If an online portal or examination form enforces a strict upload limit (such as 100 KB, 200 KB, 300 KB, 500 KB, or 1 MB), choose Target file size and pick that limit.",
  },
  {
    id: "why-limited-reduction",
    question: "Why some PDFs cannot be reduced much",
    answer:
      "PDFs made mostly of text, embedded fonts, vector illustrations, or already compressed scans have very little redundant data left to remove. In those cases, BinRo preserves your original file instead of producing a larger copy.",
  },
  {
    id: "quality-and-signatures",
    question: "How compression affects readability and digital signatures",
    answer:
      "Text and vector shapes are not converted into blurry page screenshots, so documents stay crisp and searchable. However, rewriting any signed PDF can invalidate its cryptographic digital signature—always keep an unmodified copy of signed documents.",
  },
  {
    id: "privacy-local",
    question: "Privacy and local processing",
    answer:
      "All PDF reading and compression take place locally inside your browser using a background worker. Your documents are never uploaded to BinRo servers or external services.",
  },
];

export function PdfCompressorHelp() {
  return <ToolHelpAccordion idPrefix="pdf-help" items={PDF_HELP_ITEMS} />;
}

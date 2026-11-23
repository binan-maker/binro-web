"use client";

import {
  ToolHelpAccordion,
  type ToolHelpItem,
} from "@/components/utilities/ToolUI";

const MERGER_HELP_ITEMS: ToolHelpItem[] = [
  {
    id: "how-merging-works",
    question: "How PDF merging works",
    answer:
      "BinRo PDF Merger combines pages from each selected PDF into a single new document in the exact order shown in your list. Text and vector graphics are copied rather than converted into page images.",
  },
  {
    id: "privacy-local",
    question: "Are my files uploaded to a server?",
    answer:
      "No. All PDF reading, validation, and page combining run locally inside your browser using a background worker. Your documents are never uploaded to BinRo servers.",
  },
  {
    id: "unsupported-pdfs",
    question: "Why can some PDFs not be merged?",
    answer:
      "Password-protected or encrypted PDFs and corrupted files cannot be combined safely without unlocking or repairing them first. Merging signed PDFs will also invalidate cryptographic digital signatures, and interactive form fields or bookmarks from individual files may not carry over identically.",
  },
  {
    id: "limits",
    question: "File and size limits",
    answer:
      "To keep browser memory reliable across desktop and mobile devices, you can combine up to 30 PDF files per merge (up to 100 MB per file and 200 MB combined).",
  },
];

export function PdfMergerHelp() {
  return (
    <ToolHelpAccordion idPrefix="pdf-merger-help" items={MERGER_HELP_ITEMS} />
  );
}

"use client";

import {
  ToolHelpAccordion,
  type ToolHelpItem,
} from "@/components/utilities/ToolUI";

const SPLITTER_HELP_ITEMS: ToolHelpItem[] = [
  {
    id: "how-splitting-works",
    question: "How PDF splitting works",
    answer:
      "BinRo PDF Splitter extracts pages directly into new PDF files inside your browser. Choose Extract selected pages to click specific pages or enter ranges into one file, Split by page ranges to divide sections into separate PDFs, or Split every page to save each page individually.",
  },
  {
    id: "privacy-local",
    question: "Are my PDF files uploaded anywhere?",
    answer:
      "No. All PDF parsing, page extraction, and ZIP packaging run locally on your device inside a browser worker. Your files are never uploaded to BinRo servers.",
  },
  {
    id: "limitations",
    question: "What happens to digital signatures, forms, or bookmarks?",
    answer:
      "Splitting creates new PDF documents, which invalidates cryptographic digital signatures. Interactive form fields, document outlines/bookmarks, annotations, cross-page links, and original document metadata may also not carry over identically.",
  },
  {
    id: "limits",
    question: "File size and page limits",
    answer:
      "Supports single unencrypted PDFs up to 150 MB, up to 100 custom range groups, and up to 300 pages in Split every page mode. For larger PDFs, use Split by page ranges to separate chapters or sections.",
  },
];

export function PdfSplitterHelp() {
  return (
    <ToolHelpAccordion
      idPrefix="pdf-splitter-help"
      items={SPLITTER_HELP_ITEMS}
    />
  );
}

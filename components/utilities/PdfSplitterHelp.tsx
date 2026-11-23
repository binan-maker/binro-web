"use client";

import { useState, type SVGProps } from "react";

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

interface HelpItem {
  id: string;
  question: string;
  answer: string;
}

const SPLITTER_HELP_ITEMS: HelpItem[] = [
  {
    id: "how-splitting-works",
    question: "How PDF splitting works",
    answer:
      "BinRo PDF Splitter extracts pages directly into new PDF files inside your browser. Choose Split by page ranges to divide sections into separate PDFs, Extract selected pages to build one file in your chosen order, or Split every page to save each page individually.",
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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#466677]">Help & reference</h2>
      <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
        {SPLITTER_HELP_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`pdf-splitter-help-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5C7E8F]"
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-[#466677] transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div
                  id={`pdf-splitter-help-${item.id}`}
                  className="max-w-[68ch] px-5 pb-4 text-sm leading-relaxed text-[#556168] text-pretty"
                >
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

const MERGER_HELP_ITEMS: HelpItem[] = [
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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#5C7E8F]">Help & reference</h2>
      <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
        {MERGER_HELP_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`pdf-merger-help-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5C7E8F]"
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-[#5C7E8F] transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div
                  id={`pdf-merger-help-${item.id}`}
                  className="px-5 pb-4 text-sm leading-relaxed text-[#556168]"
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

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

const PDF_HELP_ITEMS: HelpItem[] = [
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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#5C7E8F]">Help & reference</h2>
      <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
        {PDF_HELP_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`pdf-help-${item.id}`}
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
                  id={`pdf-help-${item.id}`}
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

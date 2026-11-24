"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const HOW_TO_STEPS: string[] = [
  "Type or paste your text in the editor, and optionally format headings, bold, italic, underline, or lists.",
  "Insert ---pagebreak--- (or click Page break) wherever you want content to start on a fresh sheet.",
  "Choose a handwriting-style font (Kalam, Caveat, or Patrick Hand), ink colour, and subtle natural variation.",
  "Pick your paper format (A4, A5, or US Letter), orientation, ruling style, and page margins.",
  "Preview every page in real proportions, then export as a multi-page PDF, PNG images, or print directly.",
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-paper-studio",
    question: "What is BinRo Paper Studio intended for?",
    answer:
      "BinRo Paper Studio turns typed notes, letters, study summaries, reading handouts, and checklists into clean handwriting-style printable pages. It is designed for personal notes, creative documents, handwriting practice sheets, and accessible formatting.",
  },
  {
    id: "privacy",
    question: "Is my text uploaded to any server?",
    answer:
      "No. Everything happens locally inside your browser. Your text, font rendering, pagination, PNG images, and PDF exports never leave your device, and no account is required.",
  },
  {
    id: "pagination",
    question: "How does pagination decide where each page ends?",
    answer:
      "Pages are paginated from measured word widths, line heights, headings, list markers, blank lines, margins, and your chosen paper size (such as 210 × 297 mm for A4). Both the on-screen preview and exported PDF use the same pagination layout.",
  },
  {
    id: "page-breaks",
    question: "How do I force a new page?",
    answer:
      "Click the Page break button in the editor toolbar or place ---pagebreak--- on its own line. The following text begins cleanly at the top of the next sheet.",
  },
  {
    id: "fonts-and-unicode",
    question: "Which languages and characters are supported by the bundled fonts?",
    answer:
      "All three fonts are self-hosted under the SIL Open Font License 1.1. Kalam supports Latin, Latin Extended, and Devanagari (including ₹); Caveat supports Latin, Latin Extended, and Cyrillic; Patrick Hand supports Latin, Latin Extended, and Vietnamese. If your text includes unsupported symbols or scripts, the editor shows a clear notice.",
  },
  {
    id: "natural-variation",
    question: "What does the Natural variation setting do?",
    answer:
      "When set to Subtle (default) or Moderate, it applies tiny deterministic word-spacing, baseline, and ink-opacity differences using a repeatable seed so lines feel less rigid without rotating letters, hurting readability, or changing line wrapping.",
  },
  {
    id: "printing-tips",
    question: "How do I get the cleanest result when printing from the browser?",
    answer:
      "Click Print in the export panel. In your browser print dialog, ensure margins are set to None (or Default if your printer requires unprintable edge clearance) and enable Background graphics if you want ruled lines, grid, or paper tint printed.",
  },
];

export function PaperStudioHelp() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8">
      <section aria-labelledby="paper-studio-how-to-heading">
        <h2
          id="paper-studio-how-to-heading"
          className="text-sm font-medium text-[#466677]"
        >
          How to create handwriting-style pages
        </h2>
        <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_TO_STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-[#D4DDE2] bg-white p-4"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F6F7] font-mono text-xs font-semibold text-[#426579] tabular-nums">
                {index + 1}
              </span>
              <p className="mt-2.5 text-xs leading-relaxed text-[#556168] text-pretty">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="paper-studio-faq-heading">
        <h2
          id="paper-studio-faq-heading"
          className="text-sm font-medium text-[#466677]"
        >
          Frequently asked questions
        </h2>
        <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;

            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`paper-studio-faq-${item.id}`}
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
                    id={`paper-studio-faq-${item.id}`}
                    className="max-w-[68ch] px-5 pb-4 text-sm leading-relaxed text-[#556168] text-pretty"
                  >
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

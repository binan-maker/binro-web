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

const HELP_ITEMS: HelpItem[] = [
  {
    id: "how-to-resize",
    question: "How to resize an image for forms or uploads",
    answer:
      "Choose or drop a JPG, PNG, or WebP image. Enter the exact width or height in pixels—keeping Maintain aspect ratio checked prevents stretching—and select Resize image. Useful for passport photos, scanned signatures, ID proofs, and web assets.",
  },
  {
    id: "how-to-reduce",
    question: "How to stay under a KB file size limit",
    answer:
      "Select JPG or WebP, enter your maximum size in KB (such as 20 KB, 50 KB, or 100 KB), and select Resize image. BinRo searches for the highest visual quality that fits within your KB limit.",
  },
  {
    id: "supported-formats",
    question: "Choosing between JPG, PNG, and WebP",
    answer:
      "Use JPG for photos, signatures, and strict portal upload limits. Use PNG when you need lossless detail or transparent backgrounds. Use WebP for compact web images with optional transparency.",
  },
  {
    id: "target-unreachable",
    question: "Why some file-size targets cannot be reached",
    answer:
      "Very large pixel dimensions or lossless PNG output require a minimum amount of data. If a KB limit cannot be reached, lower the pixel dimensions slightly or switch from PNG to JPG or WebP.",
  },
  {
    id: "privacy-offline",
    question: "Privacy and offline usage",
    answer:
      "All resizing and compression run locally on your device—files are never uploaded. After your first online visit caches the tool, you can reopen and use it without an internet connection.",
  },
];

export function ImageResizerHelp() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#466677]">Help & reference</h2>
      <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
        {HELP_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`help-panel-${item.id}`}
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
                  id={`help-panel-${item.id}`}
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

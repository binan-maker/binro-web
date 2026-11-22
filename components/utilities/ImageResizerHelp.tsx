"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";

interface HelpItem {
  id: string;
  question: string;
  answer: string;
}

const HELP_ITEMS: HelpItem[] = [
  {
    id: "how-to-resize",
    question: "How to resize an image",
    answer:
      "Choose or drop a JPG, PNG, or WebP image. Enter the required width or height in pixels—keeping Maintain aspect ratio checked prevents stretching—and select Resize image.",
  },
  {
    id: "how-to-reduce",
    question: "How to reduce image size",
    answer:
      "Set a maximum file size in KB using a preset or custom number, choose JPG or WebP format, and select Resize image. The tool finds the highest quality that fits within your KB target.",
  },
  {
    id: "supported-formats",
    question: "Supported formats",
    answer:
      "You can upload and export JPG/JPEG, PNG, and WebP images. Use JPG for photos and small form uploads, PNG for lossless transparency, and WebP for efficient web sizes.",
  },
  {
    id: "target-unreachable",
    question: "Why some file-size targets cannot be reached",
    answer:
      "Large pixel dimensions or lossless formats like PNG require a minimum amount of data. If a target KB limit cannot be reached, reduce the pixel dimensions or switch from PNG to JPG or WebP.",
  },
  {
    id: "privacy-offline",
    question: "Privacy and offline usage",
    answer:
      "All resizing and compression run locally in your browser—files are never uploaded. After your first online visit caches the tool, you can reopen and use it without an internet connection.",
  },
];

export function ImageResizerHelp() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#5C7E8F]">Help & reference</h2>
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
                  className={`h-4 w-4 shrink-0 text-[#5C7E8F] transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div
                  id={`help-panel-${item.id}`}
                  className="px-5 pb-4 text-sm leading-relaxed text-[#4A555C]"
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

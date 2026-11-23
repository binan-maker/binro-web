"use client";

import {
  ToolHelpAccordion,
  type ToolHelpItem,
} from "@/components/utilities/ToolUI";

const HELP_ITEMS: ToolHelpItem[] = [
  {
    id: "how-to-resize",
    question: "How to resize an image for forms or uploads",
    answer:
      "Choose or drop a JPG, PNG, or WebP image. Enter the exact width or height in pixels—keeping the aspect ratio locked prevents stretching—or pick a quick scale percentage, then select Resize image.",
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
  return <ToolHelpAccordion idPrefix="help-panel" items={HELP_ITEMS} />;
}

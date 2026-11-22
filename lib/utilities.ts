export type UtilityCategoryId =
  | "image-tools"
  | "pdf-document-tools"
  | "file-conversion"
  | "text-utilities"
  | "calculators"
  | "productivity-tools";

export interface UtilityCategory {
  id: UtilityCategoryId;
  code: string;
  name: string;
  description: string;
}

export type UtilityToolStatus = "available" | "coming-soon";

export interface UtilityTool {
  id: string;
  name: string;
  shortTitle: string;
  shortDescription: string;
  description: string;
  categoryId: UtilityCategoryId;
  href: string;
  status: UtilityToolStatus;
  keywords: string[];
}

export const UTILITY_CATEGORIES: UtilityCategory[] = [
  {
    id: "image-tools",
    code: "A",
    name: "Image Tools",
    description:
      "Browser-based utilities for resizing, compressing, and preparing photographs, signatures, and visual assets.",
  },
  {
    id: "pdf-document-tools",
    code: "B",
    name: "PDF and Document Tools",
    description:
      "Practical tools for organising, combining, splitting, and preparing everyday documents.",
  },
  {
    id: "file-conversion",
    code: "C",
    name: "File Conversion",
    description:
      "Straightforward conversion between common document, image, and data formats.",
  },
  {
    id: "text-utilities",
    code: "D",
    name: "Text Utilities",
    description:
      "Formatting, comparison, cleanup, and writing utilities for daily digital work.",
  },
  {
    id: "calculators",
    code: "E",
    name: "Calculators",
    description:
      "Focused financial, academic, unit, and everyday calculation tools designed for clarity.",
  },
  {
    id: "productivity-tools",
    code: "F",
    name: "Productivity Tools",
    description:
      "Lightweight utilities that reduce friction in recurring personal, study, and professional tasks.",
  },
];

export const UTILITY_TOOLS: UtilityTool[] = [
  {
    id: "image-resizer",
    name: "BinRo Image Resizer",
    shortTitle: "Image Resizer",
    shortDescription: "Resize and compress images.",
    description:
      "Resize and compress photographs and signatures for online applications. Set custom dimensions and reduce image file size directly in your browser.",
    categoryId: "image-tools",
    href: "/utilities/image-resizer",
    status: "available",
    keywords: [
      "image",
      "resize",
      "resizer",
      "compress",
      "photo",
      "photograph",
      "signature",
      "application",
      "kb",
      "dimensions",
    ],
  },
  {
    id: "pdf-compressor",
    name: "BinRo PDF Compressor",
    shortTitle: "PDF Compressor",
    shortDescription: "Reduce PDF file size.",
    description:
      "Make your PDF smaller. Keep it readable. Reduce PDF file size for online applications and uploads directly in your browser.",
    categoryId: "pdf-document-tools",
    href: "/utilities/pdf-compressor",
    status: "available",
    keywords: [
      "pdf",
      "compress",
      "compressor",
      "reduce",
      "size",
      "kb",
      "mb",
      "100kb",
      "200kb",
      "300kb",
      "500kb",
      "1mb",
      "document",
      "application",
    ],
  },
  {
    id: "pdf-merger",
    name: "BinRo PDF Merger",
    shortTitle: "PDF Merger",
    shortDescription: "Combine multiple PDF files into one document.",
    description:
      "Combine multiple PDF files into one document, in the order you choose, directly in your browser.",
    categoryId: "pdf-document-tools",
    href: "/utilities/pdf-merger",
    status: "available",
    keywords: [
      "pdf",
      "merge",
      "merger",
      "combine",
      "join",
      "concatenate",
      "multiple",
      "document",
    ],
  },
];

export function getUtilityCategoryById(
  categoryId: UtilityCategoryId
): UtilityCategory | undefined {
  return UTILITY_CATEGORIES.find((cat) => cat.id === categoryId);
}

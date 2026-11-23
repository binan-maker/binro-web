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

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const HOW_TO_STEPS: string[] = [
  "Select one or multiple images from your device, or drop them into the upload box.",
  "Arrange your images in the page order you want and rotate any sideways photos.",
  "Choose your preferred page size, orientation, and margin.",
  "Click Convert to PDF to generate your multi-page document in your browser.",
  "Download your finished PDF file.",
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "multiple-images",
    question: "Can I convert multiple images into one PDF?",
    answer:
      "Yes. You can select multiple images together or click Add More Images to append additional files. Each image is placed on its own page inside one combined PDF document.",
  },
  {
    id: "change-order",
    question: "Can I change the order of images?",
    answer:
      "Yes. Drag rows in the image list or use the move up and move down buttons on any image to set the exact page order before converting.",
  },
  {
    id: "page-size",
    question: "Can I choose A4 or Letter page size?",
    answer:
      "Yes. You can choose A4, US Letter, or Fit to Image, along with Auto, Portrait, or Landscape orientation and None, Small, or Large margins.",
  },
  {
    id: "uploaded-to-server",
    question: "Are my images uploaded to a server?",
    answer:
      "No. Your images are inspected, arranged, and converted into a PDF directly inside your browser. Nothing is uploaded to BinRo servers.",
  },
  {
    id: "file-size",
    question: "Does converting an image to PDF reduce its file size?",
    answer:
      "Not usually. Converting images to PDF embeds your image data so documents stay crisp and readable, so the resulting PDF can be similar in size to or larger than the original images. If you need a smaller PDF afterwards, use the BinRo PDF Compressor.",
  },
  {
    id: "supported-formats",
    question: "Which image formats are supported?",
    answer:
      "This tool supports JPG, JPEG, PNG, WebP, BMP, and GIF images. Animated GIFs use their first frame. HEIC, HEIF, TIFF, and SVG files are not supported.",
  },
  {
    id: "mobile-use",
    question: "Can I use this tool on my phone?",
    answer:
      "Yes. The layout adapts to phone screens, and you can use the tap-friendly move up, move down, rotate, and remove buttons without needing drag gestures.",
  },
];

export function ImageToPdfHelp() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px] space-y-8">
      {/* How to convert images to PDF */}
      <section aria-labelledby="how-to-convert-heading">
        <h2
          id="how-to-convert-heading"
          className="text-sm font-medium text-[#5C7E8F]"
        >
          How to convert images to PDF
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
              <p className="mt-2.5 text-xs leading-relaxed text-[#556168]">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Frequently asked questions */}
      <section aria-labelledby="image-to-pdf-faq-heading">
        <h2
          id="image-to-pdf-faq-heading"
          className="text-sm font-medium text-[#5C7E8F]"
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
                  aria-controls={`image-to-pdf-faq-${item.id}`}
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
                    id={`image-to-pdf-faq-${item.id}`}
                    className="px-5 pb-4 text-sm leading-relaxed text-[#556168]"
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

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { PaperStudio } from "@/components/utilities/PaperStudio";
import { PaperStudioHelp } from "@/components/utilities/PaperStudioHelp";
import "./fonts.css";

export const metadata: Metadata = {
  title: {
    absolute:
      "BinRo Paper Studio — Text to Handwriting & Printable Notebook Pages",
  },
  description:
    "Turn typed text into clean handwriting-style A4, A5, and US Letter pages with customizable paper, fonts, ink, and layouts. Processed privately in your browser.",
  alternates: {
    canonical: "/utilities/text-to-handwriting",
  },
  openGraph: {
    title:
      "BinRo Paper Studio — Text to Handwriting & Printable Notebook Pages",
    description:
      "Create handwriting-style documents, ruled notebook sheets, and handwriting practice pages locally in your browser.",
    url: `${SITE_CONFIG.url}/utilities/text-to-handwriting`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo Paper Studio",
  url: `${SITE_CONFIG.url}/utilities/text-to-handwriting`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based text to handwriting and printable notebook page creator with customizable A4, A5, and US Letter paper styles, fonts, ink, and PDF/PNG export.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
  },
};

export default function TextToHandwritingPage() {
  return (
    <div className="bg-[#F3F6F7]/65 py-5 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <div className="mx-auto w-full max-w-[1384px] px-4 sm:px-8">
        {/* Compact Title & Breadcrumb (Hidden during print) */}
        <div className="paper-studio-no-print mx-auto max-w-[1320px]">
          <nav aria-label="Breadcrumb" className="text-xs font-medium">
            <ol className="flex items-center gap-1.5 text-[#466677]">
              <li>
                <Link
                  href="/utilities"
                  className="inline-flex min-h-[32px] items-center rounded-sm underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Utilities
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#20272B]">Paper Studio</li>
            </ol>
          </nav>

          <div className="mt-1.5 space-y-1">
            <h1 className="text-[clamp(1.5rem,1.25rem+1vw,1.875rem)] font-semibold tracking-tight text-[#20272B]">
              Paper Studio — Text to Handwriting
            </h1>
            <p className="max-w-[68ch] text-sm leading-relaxed text-[#556168] text-pretty">
              Turn typed text into handwriting-style pages with customizable
              paper, fonts, ink, and A4/A5/Letter layouts — ideal for personal
              notes, printable messages, practice sheets, and accessible
              handouts.
            </p>
          </div>
        </div>

        {/* Main Studio Workspace */}
        <div className="mt-4 sm:mt-5">
          <PaperStudio />
        </div>

        {/* Cross-Links to Sibling Tools */}
        <div className="paper-studio-no-print mx-auto mt-6 max-w-[1320px]">
          <p className="text-xs leading-relaxed text-[#556168]">
            Need to work with existing PDFs or images?{" "}
            <Link
              href="/utilities/pdf-compressor"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Compressor
            </Link>
            ,{" "}
            <Link
              href="/utilities/pdf-merger"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Merger
            </Link>
            ,{" "}
            <Link
              href="/utilities/pdf-splitter"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Splitter
            </Link>
            ,{" "}
            <Link
              href="/utilities/image-resizer"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Image Resizer
            </Link>{" "}
            or{" "}
            <Link
              href="/utilities/image-to-pdf"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Image to PDF
            </Link>
            .
          </p>
        </div>

        {/* How-To & FAQ */}
        <div className="paper-studio-no-print mt-6 sm:mt-8">
          <PaperStudioHelp />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PdfSplitter } from "@/components/utilities/PdfSplitter";
import { PdfSplitterHelp } from "@/components/utilities/PdfSplitterHelp";

export const metadata: Metadata = {
  title: {
    absolute: "Split PDF Files Online Free — PDF Splitter | BinRo",
  },
  description:
    "Separate PDF pages into individual documents or extract exactly the pages you need. Free, private PDF splitter that runs locally in your browser without uploads.",
  alternates: {
    canonical: "/utilities/pdf-splitter",
  },
  openGraph: {
    title: "Split PDF Files Online Free — PDF Splitter | BinRo",
    description:
      "Separate PDF pages into individual documents or extract exactly the pages you need. Processed locally in your browser.",
    url: `${SITE_CONFIG.url}/utilities/pdf-splitter`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo PDF Splitter",
  url: `${SITE_CONFIG.url}/utilities/pdf-splitter`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based PDF splitter to divide PDFs by page ranges, extract selected pages, or split every page into individual documents locally on your device.",
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

export default function PdfSplitterPage() {
  return (
    <div className="bg-[#F3F6F7]/65 py-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <Container>
        {/* Compact Title & Breadcrumb */}
        <div className="mx-auto max-w-[1040px]">
          <nav aria-label="Breadcrumb" className="text-xs font-medium">
            <ol className="flex items-center gap-1.5 text-[#5C7E8F]">
              <li>
                <Link
                  href="/utilities"
                  className="rounded-sm hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Utilities
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#20272B]">PDF Splitter</li>
            </ol>
          </nav>

          <div className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20272B] sm:text-[1.875rem]">
              Split PDF files online
            </h1>
            <p className="text-sm text-[#556168]">
              Separate PDF pages into individual documents or extract exactly
              the pages you need.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-5 sm:mt-6">
          <PdfSplitter />
        </div>

        {/* Subtle Cross-Links */}
        <div className="mx-auto mt-8 max-w-[1040px]">
          <p className="text-xs text-[#556168]">
            Need to combine documents or reduce file size?{" "}
            <Link
              href="/utilities/pdf-merger"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Merger
            </Link>
            ,{" "}
            <Link
              href="/utilities/pdf-compressor"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Compressor
            </Link>{" "}
            or{" "}
            <Link
              href="/utilities/image-resizer"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Image Resizer
            </Link>
            .
          </p>
        </div>

        {/* Concise Help & Reference */}
        <div className="mt-8 sm:mt-10">
          <PdfSplitterHelp />
        </div>
      </Container>
    </div>
  );
}

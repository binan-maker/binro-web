import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PdfMerger } from "@/components/utilities/PdfMerger";
import { PdfMergerHelp } from "@/components/utilities/PdfMergerHelp";

export const metadata: Metadata = {
  title: {
    absolute: "Merge PDF Files Online — Free PDF Merger | BinRo",
  },
  description:
    "Combine multiple PDF files into one document, in the order you choose. Free, private PDF merger that runs directly in your browser without uploading files.",
  alternates: {
    canonical: "/utilities/pdf-merger",
  },
  openGraph: {
    title: "Merge PDF Files Online — Free PDF Merger | BinRo",
    description:
      "Combine multiple PDF files into one document, in the order you choose. Processed privately in your browser.",
    url: `${SITE_CONFIG.url}/utilities/pdf-merger`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo PDF Merger",
  url: `${SITE_CONFIG.url}/utilities/pdf-merger`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based PDF merger that combines multiple PDF files into one ordered document locally on your device.",
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

export default function PdfMergerPage() {
  return (
    <div className="bg-[#F3F6F7]/65 py-5 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <Container>
        {/* Compact Title & Breadcrumb */}
        <div className="mx-auto max-w-[1040px]">
          <nav aria-label="Breadcrumb" className="text-xs font-medium">
            <ol className="flex items-center gap-1.5 text-[#466677]">
              <li>
                <Link
                  href="/utilities"
                  className="inline-flex min-h-[32px] items-center rounded-sm hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Utilities
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#20272B]">PDF Merger</li>
            </ol>
          </nav>

          <div className="mt-1.5 space-y-1">
            <h1 className="text-[clamp(1.5rem,1.25rem+1vw,1.875rem)] font-semibold tracking-tight text-[#20272B]">
              Merge PDF files
            </h1>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[#556168] text-pretty">
              Combine multiple PDFs into one document in the exact order you
              choose.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-4 sm:mt-5">
          <PdfMerger />
        </div>

        {/* Subtle Cross-Links */}
        <div className="mx-auto mt-6 max-w-[1040px]">
          <p className="text-xs leading-relaxed text-[#556168]">
            Need to split pages or reduce file size?{" "}
            <Link
              href="/utilities/pdf-splitter"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Splitter
            </Link>
            ,{" "}
            <Link
              href="/utilities/pdf-compressor"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Compressor
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

        {/* Concise Help & Reference */}
        <div className="mt-6 sm:mt-8">
          <PdfMergerHelp />
        </div>
      </Container>
    </div>
  );
}

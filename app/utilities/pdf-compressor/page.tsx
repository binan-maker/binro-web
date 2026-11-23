import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { PdfCompressor } from "@/components/utilities/PdfCompressor";
import { PdfCompressorHelp } from "@/components/utilities/PdfCompressorHelp";

export const metadata: Metadata = {
  title: {
    absolute: "BinRo PDF Compressor — Reduce PDF File Size Online",
  },
  description:
    "Compress PDF files online without uploading them. Reduce PDF size to 100 KB, 200 KB, 300 KB, 500 KB, or 1 MB for online applications while keeping documents readable.",
  alternates: {
    canonical: "/utilities/pdf-compressor",
  },
  openGraph: {
    title: "BinRo PDF Compressor — Reduce PDF File Size Online",
    description:
      "Make your PDF smaller. Keep it readable. Compress PDF documents privately in your browser.",
    url: `${SITE_CONFIG.url}/utilities/pdf-compressor`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo PDF Compressor",
  url: `${SITE_CONFIG.url}/utilities/pdf-compressor`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based PDF compressor that reduces PDF file size while keeping text readable and processing files locally on your device.",
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

export default function PdfCompressorPage() {
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
                  className="inline-flex min-h-[32px] items-center rounded-sm underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Utilities
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#20272B]">PDF Compressor</li>
            </ol>
          </nav>

          <div className="mt-1.5 space-y-1">
            <h1 className="text-[clamp(1.5rem,1.25rem+1vw,1.875rem)] font-semibold tracking-tight text-[#20272B]">
              Compress PDF
            </h1>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[#556168] text-pretty">
              Reduce PDF file size for online forms, uploads, and email while
              keeping text clear.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-4 sm:mt-5">
          <PdfCompressor />
        </div>

        {/* Subtle Cross-Link to Related Tools */}
        <div className="mx-auto mt-6 max-w-[1040px]">
          <p className="text-xs leading-relaxed text-[#556168]">
            Working with multiple documents or images?{" "}
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
              className="font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
            >
              Image Resizer
            </Link>{" "}
            or{" "}
            <Link
              href="/utilities/image-to-pdf"
              className="font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
            >
              Image to PDF
            </Link>
            .
          </p>
        </div>

        {/* Collapsed Optional Reference */}
        <div className="mt-6 sm:mt-8">
          <PdfCompressorHelp />
        </div>
      </Container>
    </div>
  );
}

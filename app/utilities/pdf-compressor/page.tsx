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
              <li className="text-[#20272B]">PDF Compressor</li>
            </ol>
          </nav>

          <div className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20272B] sm:text-[1.875rem]">
              Compress PDF
            </h1>
            <p className="text-sm text-[#556168]">
              Reduce PDF file size while keeping it readable.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-5 sm:mt-6">
          <PdfCompressor />
        </div>

        {/* Subtle Cross-Link to Image Resizer */}
        <div className="mx-auto mt-8 max-w-[1040px]">
          <p className="text-xs text-[#556168]">
            Need to resize an image instead?{" "}
            <Link
              href="/utilities/image-resizer"
              className="font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
            >
              Try Image Resizer
            </Link>
            .
          </p>
        </div>

        {/* Collapsed Optional Reference */}
        <div className="mt-8 sm:mt-10">
          <PdfCompressorHelp />
        </div>
      </Container>
    </div>
  );
}

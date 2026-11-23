import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ImageResizer } from "@/components/utilities/ImageResizer";
import { ImageResizerHelp } from "@/components/utilities/ImageResizerHelp";

export const metadata: Metadata = {
  title: {
    absolute: "BinRo Image Resizer — Resize and Compress Images Online",
  },
  description:
    "Resize and compress photos and signatures for online applications. Set custom dimensions and file-size limits with private, browser-based image processing.",
  alternates: {
    canonical: "/utilities/image-resizer",
  },
  openGraph: {
    title: "BinRo Image Resizer — Resize and Compress Images Online",
    description:
      "Resize and compress photos and signatures for online applications. Set custom dimensions and file-size limits with private, browser-based image processing.",
    url: `${SITE_CONFIG.url}/utilities/image-resizer`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo Image Resizer",
  url: `${SITE_CONFIG.url}/utilities/image-resizer`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based image resizer and compressor to resize photos and signatures to exact pixel dimensions and KB file-size limits locally on your device.",
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

export default function ImageResizerPage() {
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
              <li className="text-[#20272B]">Image Resizer</li>
            </ol>
          </nav>

          <div className="mt-1.5 space-y-1">
            <h1 className="text-[clamp(1.5rem,1.25rem+1vw,1.875rem)] font-semibold tracking-tight text-[#20272B]">
              Image Resizer
            </h1>
            <p className="max-w-[62ch] text-sm leading-relaxed text-[#556168] text-pretty">
              Resize photos and signatures to exact pixel dimensions or KB limits
              locally in your browser.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-4 sm:mt-5">
          <ImageResizer />
        </div>

        {/* Subtle Cross-Links */}
        <div className="mx-auto mt-6 max-w-[1040px]">
          <p className="text-xs leading-relaxed text-[#556168]">
            Working with PDF documents?{" "}
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

        {/* Collapsed Optional Help */}
        <div className="mt-6 sm:mt-8">
          <ImageResizerHelp />
        </div>
      </Container>
    </div>
  );
}

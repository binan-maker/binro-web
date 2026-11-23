import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ImageToPdf } from "@/components/utilities/ImageToPdf";
import { ImageToPdfHelp } from "@/components/utilities/ImageToPdfHelp";

export const metadata: Metadata = {
  title: {
    absolute: "Image to PDF Converter Online Free | BINRO",
  },
  description:
    "Convert JPG, PNG and supported images into one PDF online. Arrange images, choose page size and orientation, and download your PDF. Files are processed locally in your browser.",
  alternates: {
    canonical: "/utilities/image-to-pdf",
  },
  openGraph: {
    title: "Image to PDF Converter Online Free | BINRO",
    description:
      "Convert JPG, PNG and supported images into one PDF online. Arrange images, choose page size and orientation, and download your PDF. Files are processed locally in your browser.",
    url: `${SITE_CONFIG.url}/utilities/image-to-pdf`,
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BinRo Image to PDF",
  url: `${SITE_CONFIG.url}/utilities/image-to-pdf`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based Image to PDF converter to turn JPG, PNG, WebP, BMP, and GIF images into one multi-page PDF document locally on your device.",
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

export default function ImageToPdfPage() {
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
              <li className="text-[#20272B]">Image to PDF</li>
            </ol>
          </nav>

          <div className="mt-2.5 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20272B] sm:text-[1.875rem]">
              Convert images to PDF
            </h1>
            <p className="max-w-2xl text-sm text-[#556168]">
              Turn your images into a single PDF document. Arrange your images,
              customize the page layout and download your PDF in seconds.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-5 sm:mt-6">
          <ImageToPdf />
        </div>

        {/* Cross-Links to Sibling Tools */}
        <div className="mx-auto mt-8 max-w-[1040px]">
          <p className="text-xs leading-relaxed text-[#556168]">
            Need to adjust images or manage finished PDFs?{" "}
            <Link
              href="/utilities/image-resizer"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              Image Resizer
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
              href="/utilities/pdf-merger"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Merger
            </Link>{" "}
            or{" "}
            <Link
              href="/utilities/pdf-splitter"
              className="rounded-sm font-medium text-[#426579] underline-offset-4 hover:text-[#20272B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              PDF Splitter
            </Link>
            .
          </p>
        </div>

        {/* How-To & FAQ */}
        <div className="mt-8 sm:mt-10">
          <ImageToPdfHelp />
        </div>
      </Container>
    </div>
  );
}

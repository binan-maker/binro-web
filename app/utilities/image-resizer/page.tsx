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

export default function ImageResizerPage() {
  return (
    <div className="bg-[#F3F6F7]/65 py-6 sm:py-10">
      <Container>
        {/* Compact Title & Breadcrumb */}
        <div className="mx-auto max-w-[1040px]">
          <nav aria-label="Breadcrumb" className="text-xs font-medium">
            <ol className="flex items-center gap-1.5 text-[#5C7E8F]">
              <li>
                <Link
                  href="/utilities"
                  className="hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                >
                  Utilities
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#20272B]">Image Resizer</li>
            </ol>
          </nav>

          <div className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20272B] sm:text-[1.875rem]">
              Image Resizer
            </h1>
            <p className="text-sm text-[#4A555C]">
              Resize and compress images.
            </p>
          </div>
        </div>

        {/* Main Application */}
        <div className="mt-5 sm:mt-6">
          <ImageResizer />
        </div>

        {/* Subtle Cross-Links */}
        <div className="mx-auto mt-8 max-w-[1040px]">
          <p className="text-xs text-[#556168]">
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
        <div className="mt-8 sm:mt-10">
          <ImageResizerHelp />
        </div>
      </Container>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ImageResizer } from "@/components/utilities/ImageResizer";

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

const GUIDE_SECTIONS = [
  {
    index: "01",
    title: "How to resize an image",
    body: "Upload a JPG, PNG, or WebP file from your device or drag it into the upload area. Enter the required width or height in pixels. Keep Maintain aspect ratio enabled to avoid stretching photographs or signatures, or turn it off when an application asks for exact fixed dimensions.",
  },
  {
    index: "02",
    title: "How to reduce image size in KB",
    body: "Enable Maximum file size (KB) and choose a preset such as 20 KB, 50 KB, or 100 KB, or type a custom KB limit. When using JPEG or WebP output, BinRo Image Resizer searches for the highest visual quality that keeps the exported file within your requested KB size.",
  },
  {
    index: "03",
    title: "How to prepare a signature for an online application",
    body: "Crop your scanned or photographed signature neatly before resizing, use good lighting so the ink contrasts clearly with white paper, and check the exact pixel dimensions and KB range requested by the form. Always inspect the processed preview before uploading it to the portal you are applying on.",
  },
  {
    index: "04",
    title: "How to choose the correct output format",
    body: "Use JPEG for passport-style photographs and most form uploads where small KB sizes are required. Use PNG when you need lossless edges or transparency, noting that PNG files are usually larger and ignore quality compression. Use WebP when a modern platform accepts it for efficient file sizes and optional transparency.",
  },
  {
    index: "05",
    title: "Why a requested file-size target may not always be achievable",
    body: "Very large pixel dimensions or lossless formats like PNG have a minimum amount of data needed to represent the image. If the smallest acceptable JPEG or WebP output still exceeds your KB target, reduce the width and height in pixels or switch from PNG to JPEG or WebP.",
  },
  {
    index: "06",
    title: "Privacy and offline usage",
    body: "All decoding, resizing, compression, and file creation run directly inside your browser using native Canvas and File APIs. Your images stay on your device and are never uploaded to a server. After your first online visit caches the tool via the service worker, you can reopen and use BinRo Image Resizer without an internet connection.",
  },
];

export default function ImageResizerPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7] to-white py-12 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-xs font-medium">
              <ol className="flex flex-wrap items-center gap-2 text-[#5C7E8F]">
                <li>
                  <Link
                    href="/utilities"
                    className="hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                  >
                    BinRo Utilities
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-[#20272B]">BinRo Image Resizer</li>
              </ol>
            </nav>

            <p className="mt-4 text-sm font-medium text-[#5C7E8F]">
              BinRo Image Resizer · Prepare images. Simply.
            </p>
            <h1 className="mt-2.5 text-[clamp(1.85rem,3.6vw,3rem)] font-semibold leading-[1.14] tracking-tight text-[#20272B] text-balance">
              Resize and compress images online.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4A555C] sm:text-lg">
              Prepare your photos and signatures for online applications. Set
              the required dimensions and file size, process your image
              privately in your browser, and download the result.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#D4DDE2] bg-white px-4 py-3 text-xs leading-relaxed text-[#4A555C]">
                <span className="font-semibold text-[#20272B]">Privacy: </span>
                Your images stay on your device. BinRo does not upload your
                selected files to a processing server.
              </div>
              <div className="rounded-xl border border-[#D4DDE2] bg-white px-4 py-3 text-xs leading-relaxed text-[#4A555C]">
                <span className="font-semibold text-[#20272B]">Offline: </span>
                Image processing works locally in your browser. After the
                application has been loaded and cached, you can use it without
                an internet connection.
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14 bg-white">
        <Container>
          <ImageResizer />
        </Container>
      </section>

      <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/55 py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#5C7E8F]">
              Guidance & reference
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
              Preparing photos and signatures reliably.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4A555C] sm:text-base">
              Dimension and file-size rules vary across application portals.
              Always check the exact requirements stated by the website or
              organisation you are submitting to before uploading your final
              image.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GUIDE_SECTIONS.map((item) => (
              <article
                key={item.index}
                className="rounded-2xl border border-[#D4DDE2] bg-white p-6"
              >
                <p className="font-mono text-xs font-medium text-[#5C7E8F] tabular-nums">
                  {item.index}
                </p>
                <h3 className="mt-2.5 text-base font-semibold text-[#20272B]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

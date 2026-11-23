import type { Metadata } from "next";
import Link from "next/link";
import { DIVISIONS, getDivisionById } from "@/lib/divisions";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { UtilitiesDirectory } from "@/components/utilities/UtilitiesDirectory";

const division = getDivisionById("utilities");
const otherDivisions = DIVISIONS.filter((d) => d.id !== "utilities");

export const metadata: Metadata = {
  title: division.name,
  description:
    "Everyday digital tools made simple. Resize images and compress, merge, split, or create PDF documents directly in your browser.",
  alternates: {
    canonical: "/utilities",
  },
  openGraph: {
    title: `${division.name} | ${SITE_CONFIG.name}`,
    description:
      "Everyday digital tools made simple. Resize images and compress, merge, split, or create PDF documents directly in your browser.",
    url: `${SITE_CONFIG.url}/utilities`,
  },
};

export default function UtilitiesPage() {
  return (
    <section className="bg-white py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mx-auto max-w-[960px]">
          <header className="max-w-[58ch]">
            <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
              BinRo Utilities
            </p>
            <h1 className="mt-2.5 text-[clamp(1.75rem,1.35rem+1.5vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#20272B] text-balance">
              Useful tools for everyday digital work.
            </h1>
            <p className="mt-2.5 text-base leading-relaxed text-[#556168] text-pretty">
              Simple, practical tools to help you work with images and PDFs.
            </p>
          </header>

          <div className="mt-8 sm:mt-10">
            <UtilitiesDirectory />
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#D4DDE2]/80 pt-6 text-xs text-[#556168] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pretty">
              All tools run locally in your browser with no account required.
            </p>
            <nav
              aria-label="Other BinRo divisions"
              className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0"
            >
              {otherDivisions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="inline-flex min-h-[36px] items-center font-medium text-[#426579] transition-colors hover:text-[#20272B] hover:underline underline-offset-4 whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  {item.shortName}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Container>
    </section>
  );
}

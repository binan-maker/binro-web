import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_PURPOSE, SITE_CONFIG } from "@/lib/site";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About BinRo",
  description:
    "BinRo exists to make technology accessible, understandable, and useful to everyone—starting in India and building products that expand human capability over time.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-10 sm:py-14">
        <Container>
          <div className="max-w-[62ch]">
            <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
              About {SITE_CONFIG.legalName} · {SITE_CONFIG.tagline}
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,1.35rem+1.5vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#20272B] text-balance">
              We believe technology should expand what people can do.
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-[#556168] text-pretty">
              {COMPANY_PURPOSE.opening[1]} {COMPANY_PURPOSE.opening[2]}
            </p>
          </div>
        </Container>
      </section>

      {/* Purpose, Mission, Vision & Philosophy */}
      <section className="bg-white py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="max-w-[62ch] space-y-8 lg:col-span-7">
              <div>
                <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                  Our purpose
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                  Accessible, understandable, useful.
                </h2>
                <p className="mt-2.5 text-base leading-relaxed text-[#556168] text-pretty">
                  {COMPANY_PURPOSE.purpose}
                </p>
              </div>

              <div className="border-t border-[#D4DDE2] pt-7">
                <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                  Our mission
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                  Dependable software for real problems.
                </h2>
                <p className="mt-2.5 text-base leading-relaxed text-[#556168] text-pretty">
                  {COMPANY_PURPOSE.mission}
                </p>
              </div>

              <div className="border-t border-[#D4DDE2] pt-7">
                <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                  Our vision
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                  Opportunity through capability.
                </h2>
                <p className="mt-2.5 text-base leading-relaxed text-[#556168] text-pretty">
                  {COMPANY_PURPOSE.vision}
                </p>
              </div>
            </div>

            <div className="border-t border-[#D4DDE2] pt-7 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
              <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                Philosophy
              </p>
              <blockquote className="mt-2.5 max-w-[44ch] text-lg font-medium leading-snug text-[#20272B] text-pretty">
                &ldquo;{COMPANY_PURPOSE.philosophy}&rdquo;
              </blockquote>

              <div className="mt-7 border-t border-[#D4DDE2] pt-6">
                <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                  Long-term ambition
                </p>
                <h3 className="mt-1.5 text-base font-semibold text-[#20272B]">
                  {COMPANY_PURPOSE.ambitionHeadline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#556168] text-pretty">
                  {COMPANY_PURPOSE.ambition}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-[#466677] text-pretty">
                  BinRo is being built steadily over time. Utilities is our
                  active public focus today while our long-term divisions take
                  shape.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Permanent Values */}
      <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/50 py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                Permanent values
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                Principles that guide every decision.
              </h2>
              <p className="mt-2.5 max-w-[44ch] text-sm leading-relaxed text-[#556168] text-pretty">
                These standards shape how we design products, communicate
                limitations, and treat user data.
              </p>
            </div>

            <ol className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:col-span-8">
              {COMPANY_PURPOSE.values.map((value, idx) => (
                <li
                  key={value.title}
                  className="border-t border-[#D4DDE2] pt-4"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-medium text-[#556168] tabular-nums">
                      0{idx + 1}
                    </span>
                    <h3 className="text-base font-semibold text-[#20272B]">
                      {value.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 pl-7 text-sm leading-relaxed text-[#556168] text-pretty">
                    {value.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Four connected divisions */}
      <section className="border-t border-[#D4DDE2] bg-white py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                Structure
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                One company, four divisions.
              </h2>
              <p className="mt-2.5 max-w-[44ch] text-sm leading-relaxed text-[#556168] text-pretty">
                BinRo operates under one shared standard. Utilities is available
                today; Business, Developer, and Intelligence represent our
                long-term direction.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <Link
                  href="/utilities"
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                >
                  <span>Explore Utilities</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#556168] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                >
                  <span>Contact BinRo</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:col-span-8">
              {DIVISIONS.map((division) => (
                <Link
                  key={division.id}
                  href={division.href}
                  className="group border-t border-[#D4DDE2] pt-4 transition-colors hover:border-[#466677] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-xs sm:pt-5"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-2 font-medium text-[#20272B]">
                      <DivisionIcon
                        id={division.id}
                        className="h-4 w-4 text-[#426579]"
                      />
                      <span>{division.name}</span>
                    </span>
                    <span
                      className={
                        division.status === "active"
                          ? "font-medium text-[#0E6B56]"
                          : "font-medium text-[#466677]"
                      }
                    >
                      {division.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#556168] text-pretty">
                    {division.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

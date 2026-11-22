import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_PURPOSE, SITE_CONFIG } from "@/lib/site";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About BinRo",
  description:
    "BinRo is a technology company building practical digital utilities, business software, developer tools and applied intelligence. India first, global over time.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-14 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
              About {SITE_CONFIG.legalName}
            </p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.125rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#20272B] text-balance">
              {SITE_CONFIG.tagline}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#556168] sm:text-lg">
              {SITE_CONFIG.legalName} builds useful software, everyday digital
              tools, developer foundations, and applied intelligence systems for
              individuals and businesses.
            </p>
          </div>
        </Container>
      </section>

      {/* Purpose, Vision & Philosophy */}
      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="space-y-10 lg:col-span-7">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                  Purpose
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B]">
                  Accessible, understandable, useful.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[#556168]">
                  {COMPANY_PURPOSE.purpose}
                </p>
              </div>

              <div className="border-t border-[#D4DDE2] pt-8">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                  Vision
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B]">
                  A more technologically capable society.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[#556168]">
                  {COMPANY_PURPOSE.vision}
                </p>
              </div>
            </div>

            <div className="border-t border-[#D4DDE2] pt-8 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                Philosophy
              </p>
              <blockquote className="mt-3 text-xl font-medium leading-snug text-[#20272B]">
                &ldquo;{COMPANY_PURPOSE.philosophy}&rdquo;
              </blockquote>

              <div className="mt-8 border-t border-[#D4DDE2] pt-6">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                  Direction
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-[#556168]">
                  {COMPANY_PURPOSE.ambition}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/50 py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                Mission
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B]">
                What we are working toward.
              </h2>
            </div>

            <ol className="divide-y divide-[#D4DDE2] border-y border-[#D4DDE2] lg:col-span-8">
              {COMPANY_PURPOSE.mission.map((item, idx) => (
                <li
                  key={item}
                  className="flex items-baseline gap-5 py-4 sm:py-5"
                >
                  <span className="font-mono text-xs text-[#A2A2A2] tabular-nums">
                    0{idx + 1}
                  </span>
                  <span className="text-base font-medium text-[#20272B]">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Four connected divisions */}
      <section className="border-t border-[#D4DDE2] bg-white py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                Structure
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B]">
                One company, four divisions.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#556168]">
                Every division shares one design and engineering standard under
                BinRo.
              </p>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                >
                  <span>Contact BinRo</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {DIVISIONS.map((division) => (
                <Link
                  key={division.id}
                  href={division.href}
                  className="group border-t border-[#D4DDE2] pt-5 transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-xs"
                >
                  <div className="flex items-center justify-between text-xs text-[#5C7E8F]">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <DivisionIcon id={division.id} className="h-4 w-4" />
                      <span>{division.name}</span>
                    </span>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-[#426579] transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#556168]">
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

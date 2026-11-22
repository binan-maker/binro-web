import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_PURPOSE, SITE_CONFIG } from "@/lib/site";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About BinRo",
  description:
    "BinRo is a human-centred technology company building useful digital products, business software, developer tools and intelligent systems. India first, with a long-term global ambition.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7] to-white py-16 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#5C7E8F]">
              About {SITE_CONFIG.legalName}
            </p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[1.12] tracking-tight text-[#20272B] text-balance">
              {SITE_CONFIG.tagline}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#4A555C] sm:text-lg">
              {SITE_CONFIG.legalName} is a human-centred technology company
              building useful digital products, software, intelligent systems
              and technology infrastructure for individuals, professionals,
              developers and businesses.
            </p>
          </div>
        </Container>
      </section>

      {/* Purpose, Vision & Core Philosophy */}
      <section className="py-16 sm:py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-12">
              <div>
                <p className="text-sm font-medium text-[#5C7E8F]">Purpose</p>
                <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
                  Making technology accessible, understandable and useful.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#4A555C]">
                  {COMPANY_PURPOSE.purpose}
                </p>
              </div>

              <div className="border-t border-[#D4DDE2] pt-10">
                <p className="text-sm font-medium text-[#5C7E8F]">Vision</p>
                <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
                  A more technologically capable society.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#4A555C]">
                  {COMPANY_PURPOSE.vision}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-7 sm:p-8">
                <p className="text-xs font-medium text-[#5C7E8F]">
                  Core philosophy
                </p>
                <blockquote className="mt-4 font-display text-xl font-medium leading-snug text-[#20272B]">
                  &ldquo;{COMPANY_PURPOSE.philosophy}&rdquo;
                </blockquote>

                <div className="mt-8 border-t border-[#D4DDE2] pt-6">
                  <p className="text-xs font-medium text-[#5C7E8F]">
                    Long-term ambition
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#4A555C]">
                    {COMPANY_PURPOSE.ambition}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/55 py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#5C7E8F]">Mission</p>
            <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
              Practical steps toward lasting technological capability.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANY_PURPOSE.mission.map((item, idx) => (
              <div
                key={item}
                className="rounded-xl border border-[#D4DDE2] bg-white p-6"
              >
                <p className="font-mono text-xs font-medium text-[#5C7E8F] tabular-nums">
                  0{idx + 1}
                </p>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#20272B]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why four divisions belong together */}
      <section className="border-t border-[#D4DDE2] bg-white py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-sm font-medium text-[#5C7E8F]">
                Unified structure
              </p>
              <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
                One company with four connected divisions.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#4A555C]">
                BinRo&apos;s four divisions are not separate companies. They
                reinforce one another under a single engineering and design
                standard: everyday tools inform how we design clarity, business
                software grounds us in real operational workflows, developer
                infrastructure strengthens everything we ship, and applied
                intelligence extends what people can achieve across all three.
              </p>
              <div className="mt-8">
                <ButtonLink href="/contact" variant="primary">
                  <span>Contact information</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
              {DIVISIONS.map((division) => (
                <Link
                  key={division.id}
                  href={division.href}
                  className="group flex flex-col justify-between rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/65 p-6 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  <div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#5C7E8F]">
                      <DivisionIcon id={division.id} className="h-4 w-4" />
                      <span>Division {division.index}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[#20272B]">
                      {division.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4A555C]">
                      {division.summary}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-[#426579] group-hover:text-[#20272B]">
                    <span>Explore {division.shortName}</span>
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

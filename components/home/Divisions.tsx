import Link from "next/link";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function Divisions() {
  return (
    <section id="divisions" className="scroll-mt-20 py-20 sm:py-24 lg:py-28 bg-white">
      <Container>
        {/* Section 3: Introduction */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeading
              kicker="Company architecture"
              title="One company. Four areas of technology."
              description="BinRo brings together useful digital tools, business software, developer infrastructure and intelligent systems under one technology company."
            />
          </div>
          <div className="lg:col-span-5 lg:pb-1">
            <p className="text-sm leading-relaxed text-[#4A555C]">
              Each division serves a distinct audience—individuals, businesses,
              developers, and organisations adopting intelligent systems—while
              sharing one standard of clarity, reliability, and human-centred
              engineering.
            </p>
          </div>
        </div>

        {/* Section 4: Four Division Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {DIVISIONS.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-7 sm:p-8 transition-all duration-200 hover:border-[#5C7E8F] hover:bg-[#F3F6F7]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579] transition-colors duration-200 group-hover:border-[#5C7E8F] group-hover:bg-white"
                      style={{ color: division.accentColor }}
                    >
                      <DivisionIcon id={division.id} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#5C7E8F]">
                        Division {division.index}
                      </p>
                      <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-[#20272B]">
                        {division.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-base font-medium text-[#20272B]">
                  {division.tagline}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C] sm:text-[0.9375rem]">
                  {division.summary}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-[#D4DDE2]/80 pt-5">
                <span className="text-sm font-medium text-[#426579] transition-colors duration-150 group-hover:text-[#20272B]">
                  Explore {division.shortName}
                </span>
                <ArrowRightIcon className="h-4 w-4 text-[#5C7E8F] transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#20272B]" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

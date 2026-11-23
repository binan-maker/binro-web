import Link from "next/link";
import { DIVISIONS } from "@/lib/divisions";
import { UTILITY_TOOLS } from "@/lib/utilities";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function Divisions() {
  const availableTools = UTILITY_TOOLS.filter(
    (tool) => tool.status === "available"
  );

  return (
    <section id="divisions" className="bg-white py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Available Products Quick Launch */}
        <div className="mb-12 sm:mb-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                Available today
              </p>
              <h2 className="mt-1.5 text-[clamp(1.375rem,1.15rem+1vw,1.75rem)] font-semibold tracking-tight text-[#20272B]">
                Everyday utilities ready to use.
              </h2>
            </div>
            <Link
              href="/utilities"
              className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
            >
              <span>All utilities</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/45 px-4 py-3.5 transition-colors duration-150 hover:border-[#466677] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#20272B]">
                    {tool.shortTitle}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#556168]">
                    {tool.shortDescription}
                  </p>
                </div>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-[#426579] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#20272B]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Four Divisions Overview */}
        <div className="flex flex-col gap-2 border-t border-[#D4DDE2]/80 pt-10 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
          <div>
            <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
              Company structure
            </p>
            <h2 className="mt-1.5 text-[clamp(1.375rem,1.15rem+1vw,1.75rem)] font-semibold tracking-tight text-[#20272B]">
              One company across four divisions.
            </h2>
          </div>
          <Link
            href="/about"
            className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
          >
            <span>Purpose and vision</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {DIVISIONS.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4DDE2] bg-white p-5 transition-all duration-150 hover:border-[#466677] hover:bg-[#F3F6F7]/50 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:p-6"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-[#1CC8A0] transition-transform duration-200 group-hover:scale-x-100"
              />
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F6F7] text-[#426579] transition-colors group-hover:bg-white">
                    <DivisionIcon id={division.id} className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#556168]">
                    <span className="font-mono tabular-nums">
                      {division.index}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        division.status === "active"
                          ? "text-[#0E6B56]"
                          : "text-[#466677]"
                      }
                    >
                      {division.statusLabel}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold tracking-tight text-[#20272B] sm:text-xl">
                  {division.name}
                </h3>
                <p className="mt-1.5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[#556168] text-pretty">
                  {division.summary}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-[#426579] group-hover:text-[#20272B]">
                <span>Explore {division.shortName}</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

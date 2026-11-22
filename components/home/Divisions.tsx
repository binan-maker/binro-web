import Link from "next/link";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function Divisions() {
  return (
    <section id="divisions" className="bg-white py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
              Divisions
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl">
              Four areas of focus.
            </h2>
          </div>
          <Link
            href="/utilities/image-resizer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
          >
            <span>Available now: Image Resizer</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {DIVISIONS.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-7 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F6F7] text-[#426579] transition-colors group-hover:bg-white">
                    <DivisionIcon id={division.id} className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-[#A2A2A2] tabular-nums">
                    {division.index}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight text-[#20272B]">
                  {division.name}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[#556168]">
                  {division.summary}
                </p>
              </div>

              <div className="mt-7 flex items-center gap-1.5 text-sm font-medium text-[#426579] group-hover:text-[#20272B]">
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

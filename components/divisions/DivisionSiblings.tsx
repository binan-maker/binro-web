import Link from "next/link";
import { DIVISIONS, type DivisionId } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function DivisionSiblings({ currentId }: { currentId: DivisionId }) {
  const siblings = DIVISIONS.filter((division) => division.id !== currentId);

  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/55 py-12 sm:py-14">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#20272B]">
            Other divisions
          </h2>
          <Link
            href="/about"
            className="text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
          >
            About BinRo
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {siblings.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group flex flex-col justify-between rounded-xl border border-[#D4DDE2] bg-white p-5 transition-colors duration-150 hover:border-[#466677] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#466677]">
                  <span className="inline-flex items-center gap-2">
                    <DivisionIcon id={division.id} className="h-4 w-4" />
                    <span>{division.name}</span>
                  </span>
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
                <p className="mt-2 text-sm font-medium text-[#20272B] text-pretty">
                  {division.summary}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#426579] group-hover:text-[#20272B]">
                <span>Explore {division.shortName}</span>
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

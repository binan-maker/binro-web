import Link from "next/link";
import { DIVISIONS, type DivisionId } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function DivisionSiblings({ currentId }: { currentId: DivisionId }) {
  const siblings = DIVISIONS.filter((division) => division.id !== currentId);

  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/55 py-14 sm:py-16">
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

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {siblings.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group flex flex-col justify-between rounded-xl border border-[#D4DDE2] bg-white p-5 transition-colors duration-150 hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#5C7E8F]">
                  <DivisionIcon id={division.id} className="h-4 w-4" />
                  <span>{division.name}</span>
                </div>
                <p className="mt-2.5 text-sm font-medium text-[#20272B]">
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

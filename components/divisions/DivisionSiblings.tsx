import Link from "next/link";
import { DIVISIONS, type DivisionId } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function DivisionSiblings({ currentId }: { currentId: DivisionId }) {
  const siblings = DIVISIONS.filter((division) => division.id !== currentId);

  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/70 py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#5C7E8F]">
              Connected under BinRo
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
              Explore our other divisions
            </h2>
          </div>
          <Link
            href="/about"
            className="text-sm font-medium text-[#426579] hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
          >
            How the four divisions connect
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {siblings.map((division) => (
            <Link
              key={division.id}
              href={division.href}
              className="group flex flex-col justify-between rounded-xl border border-[#D4DDE2] bg-white p-5 transition-colors duration-150 hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              <div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#5C7E8F]">
                  <DivisionIcon id={division.id} className="h-4 w-4" />
                  <span>{division.name}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[#20272B]">
                  {division.tagline}
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-[#426579] group-hover:text-[#20272B]">
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

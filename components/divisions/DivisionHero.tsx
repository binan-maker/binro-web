import type { ReactNode } from "react";
import type { DivisionInfo } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { DivisionIcon } from "@/components/ui/Icons";

interface DivisionHeroProps {
  division: DivisionInfo;
  headline: string;
  description: string;
  note?: string;
  children?: ReactNode;
}

export function DivisionHero({
  division,
  headline,
  description,
  note,
  children,
}: DivisionHeroProps) {
  return (
    <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-14 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
            <DivisionIcon id={division.id} className="h-4 w-4 text-[#426579]" />
            <span>{division.name}</span>
          </div>

          <h1 className="mt-4 text-[clamp(2rem,4vw,3.125rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#20272B] text-balance">
            {headline}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#556168] sm:text-lg">
            {description}
          </p>

          {note ? (
            <p className="mt-3 text-sm text-[#5C7E8F]">{note}</p>
          ) : null}

          {children ? <div className="mt-7">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

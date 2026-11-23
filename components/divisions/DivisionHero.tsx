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
    <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-10 sm:py-14">
      <Container>
        <div className="max-w-[62ch]">
          <div className="flex items-center gap-2.5 text-xs font-medium tracking-[0.04em] text-[#466677]">
            <DivisionIcon id={division.id} className="h-4 w-4 text-[#426579]" />
            <span>{division.name}</span>
          </div>

          <h1 className="mt-3 text-[clamp(1.75rem,1.35rem+1.5vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#20272B] text-balance">
            {headline}
          </h1>

          <p className="mt-3.5 text-base leading-relaxed text-[#556168] text-pretty">
            {description}
          </p>

          {note ? (
            <p className="mt-2.5 text-sm font-medium text-[#466677]">{note}</p>
          ) : null}

          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

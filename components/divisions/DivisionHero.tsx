import type { ReactNode } from "react";
import type { DivisionInfo } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { DivisionIcon } from "@/components/ui/Icons";

interface DivisionHeroProps {
  division: DivisionInfo;
  headline: string;
  description: string;
  children?: ReactNode;
}

export function DivisionHero({
  division,
  headline,
  description,
  children,
}: DivisionHeroProps) {
  return (
    <section
      className="border-b border-[#D4DDE2] py-16 sm:py-22 lg:py-24"
      style={{
        background: `linear-gradient(180deg, ${division.accentSurface} 0%, #FFFFFF 100%)`,
      }}
    >
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white"
                style={{ color: division.accentColor }}
              >
                <DivisionIcon id={division.id} className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-[#5C7E8F]">
                Division {division.index} · {division.name}
              </p>
            </div>

            <h1 className="mt-6 text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[1.12] tracking-tight text-[#20272B] text-balance">
              {headline}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4A555C] sm:text-lg">
              {description}
            </p>
            {children ? <div className="mt-8">{children}</div> : null}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-[#D4DDE2] bg-white p-5">
              <p className="text-xs font-medium text-[#5C7E8F]">
                Development status
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#4A555C]">
                {division.statusNote}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

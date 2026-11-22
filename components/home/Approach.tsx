import { APPROACH_PRINCIPLES } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Approach() {
  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/55 py-20 sm:py-24">
      <Container>
        <SectionHeading
          kicker="Our approach"
          title="Three principles guiding everything we build."
        />

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-[#D4DDE2] pt-10 md:grid-cols-3 md:gap-10">
          {APPROACH_PRINCIPLES.map((principle) => (
            <div key={principle.index}>
              <p className="font-mono text-xs font-medium text-[#5C7E8F] tabular-nums">
                {principle.index}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#20272B]">
                {principle.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4A555C] sm:text-[0.9375rem]">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

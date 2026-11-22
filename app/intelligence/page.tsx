import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { DivisionAreas } from "@/components/divisions/DivisionAreas";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("intelligence");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/intelligence",
  },
};

const APPLIED_PRINCIPLES = [
  {
    title: "Applied products over hype",
    detail:
      "We build practical software using proven foundation models and AI services rather than making unverified claims.",
  },
  {
    title: "Human oversight",
    detail:
      "Assistants and automated agents should remain clear, predictable, and easy for people to guide and verify.",
  },
  {
    title: "Integrated utility",
    detail:
      "Designed to strengthen everyday utilities, business software, and developer workflows across BinRo.",
  },
];

export default function IntelligencePage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline="Intelligence that helps people achieve more."
        description={division.overview}
        note="In planning — applied AI products are not yet publicly launched."
      />

      <section className="bg-white py-14 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                Approach
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                Grounded in real utility.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-8">
              {APPLIED_PRINCIPLES.map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-semibold text-[#20272B]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#556168]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-[#D4DDE2] bg-white py-14 sm:py-20">
        <Container>
          <SectionHeading
            kicker="Planned areas"
            title="Applied AI directions."
          />

          <div className="mt-10">
            <DivisionAreas categories={division.categories} columns={2} />
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="intelligence" />
    </>
  );
}

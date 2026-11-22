import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { ProductCard } from "@/components/divisions/ProductCard";
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
    title: "Applied systems over hype",
    detail:
      "BinRo focuses on practical software products built with existing foundation models and AI services—not unverified claims of building our own foundational model.",
  },
  {
    title: "Human control and transparency",
    detail:
      "Intelligent assistants and workflow agents should clarify decisions, respect human oversight, and remain understandable to the people using them.",
  },
  {
    title: "Integrated across divisions",
    detail:
      "Applied intelligence is designed to strengthen everyday utilities, business operations software, and developer workflows across BinRo.",
  },
];

export default function IntelligencePage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline="Intelligence that helps people achieve more."
        description={division.overview}
      />

      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-7 sm:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-sm font-medium text-[#5C7E8F]">
                  Our approach to AI
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B] text-balance">
                  Practical intelligence grounded in real utility.
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
                {APPLIED_PRINCIPLES.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[#D4DDE2] bg-white p-5"
                  >
                    <h3 className="text-base font-semibold text-[#20272B]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-[#D4DDE2] py-16 sm:py-24 bg-white">
        <Container>
          <SectionHeading
            kicker="Planned intelligence areas"
            title="Future AI-powered products and systems."
            description="These categories describe the applied AI directions BinRo plans to explore. They are not released products."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {division.categories.map((category, index) => (
              <ProductCard
                key={category.title}
                category={category}
                index={index}
              />
            ))}
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="intelligence" />
    </>
  );
}

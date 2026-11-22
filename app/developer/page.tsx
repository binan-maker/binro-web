import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { ProductCard } from "@/components/divisions/ProductCard";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("developer");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/developer",
  },
};

const ARCHITECTURE_LAYERS = [
  {
    layer: "Core Platform",
    items: [
      "Predictable REST and typed SDK interfaces",
      "Authentication and access primitives",
      "Event webhooks and external integrations",
    ],
  },
  {
    layer: "Build & Test",
    items: [
      "Developer utilities for daily workflows",
      "Clear human-readable API documentation",
      "Request testing and debugging aids",
    ],
  },
  {
    layer: "Operate",
    items: [
      "Dependable hosting and service infrastructure",
      "Monitoring and operational visibility",
      "Usage analytics for engineering teams",
    ],
  },
];

export default function DeveloperPage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline="Build more. Build better."
        description={division.overview}
      />

      <section className="py-16 sm:py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                kicker="Platform direction"
                title="Infrastructure designed to stay out of the builder's way."
                description="BinRo Developer is planned as the foundational toolkit for software creators—focusing on clarity, dependable interfaces, and low operational friction."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:col-span-7">
              {ARCHITECTURE_LAYERS.map((group, idx) => (
                <div
                  key={group.layer}
                  className="rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] p-5"
                >
                  <p className="font-mono text-xs text-[#5C7E8F] tabular-nums">
                    Layer 0{idx + 1}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[#20272B]">
                    {group.layer}
                  </h3>
                  <ul className="mt-4 space-y-2.5 border-t border-[#D4DDE2] pt-4 text-xs leading-relaxed text-[#4A555C]">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-[#D4DDE2] py-16 sm:py-24 bg-white">
        <Container>
          <SectionHeading
            kicker="Areas of future development"
            title="Planned developer platform categories."
            description="Every area below outlines future developer capabilities under consideration as BinRo expands its technical infrastructure."
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

      <DivisionSiblings currentId="developer" />
    </>
  );
}

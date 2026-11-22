import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { DivisionAreas } from "@/components/divisions/DivisionAreas";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("developer");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/developer",
  },
};

const PLATFORM_LAYERS = [
  {
    index: "01",
    layer: "Platform",
    items: [
      "Consistent REST interfaces and typed SDKs",
      "Authentication and access primitives",
      "Event webhooks and external integrations",
    ],
  },
  {
    index: "02",
    layer: "Build & Test",
    items: [
      "Developer utilities for everyday tasks",
      "Clear, readable API documentation",
      "Request inspection and verification tools",
    ],
  },
  {
    index: "03",
    layer: "Operate",
    items: [
      "Dependable hosting and service infrastructure",
      "Operational monitoring and health visibility",
      "Usage metrics for engineering teams",
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
        note="In planning — APIs and platform services are not yet publicly launched."
      />

      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <SectionHeading
                kicker="Architecture"
                title="Structured primitives that stay out of the way."
              />
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-8">
              {PLATFORM_LAYERS.map((group) => (
                <div
                  key={group.layer}
                  className="border-t border-[#D4DDE2] pt-4"
                >
                  <p className="font-mono text-xs text-[#A2A2A2] tabular-nums">
                    {group.index}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[#20272B]">
                    {group.layer}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#556168]">
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

      <section className="border-t border-[#D4DDE2] bg-white py-14 sm:py-20">
        <Container>
          <SectionHeading
            kicker="Planned categories"
            title="Developer platform areas."
          />

          <div className="mt-10">
            <DivisionAreas categories={division.categories} columns={2} />
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="developer" />
    </>
  );
}

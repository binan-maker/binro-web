import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { DivisionAreas } from "@/components/divisions/DivisionAreas";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("business");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/business",
  },
};

const BUSINESS_PRINCIPLES = [
  {
    title: "Built for daily operations",
    detail:
      "Practical workflows that help teams keep records, inventory, billing, and customer activity organised.",
  },
  {
    title: "Clear to adopt",
    detail:
      "Interfaces designed so business owners and staff can understand their operational data without steep training.",
  },
  {
    title: "Dependable foundation",
    detail:
      "Structured software built to grow reliably alongside real business needs.",
  },
];

export default function BusinessPage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline={division.tagline}
        description={division.overview}
        note="In planning — no public products launched yet."
      />

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <SectionHeading
            kicker="Planned product areas"
            title="Software areas we aim to build."
          />

          <div className="mt-8">
            <DivisionAreas categories={division.categories} columns={2} />
          </div>
        </Container>
      </section>

      <section className="border-t border-[#D4DDE2] bg-white py-12 sm:py-14">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
                Approach
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                Clarity over bloat.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
              {BUSINESS_PRINCIPLES.map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-semibold text-[#20272B]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#556168] text-pretty">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="business" />
    </>
  );
}

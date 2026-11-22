import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { ProductCard } from "@/components/divisions/ProductCard";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("business");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/business",
  },
};

const BUSINESS_APPROACH = [
  {
    title: "Built for daily operations",
    detail:
      "Focused on practical workflows that help teams organise records, finances, inventory, and customer activity without unnecessary complexity.",
  },
  {
    title: "Clarity over bloat",
    detail:
      "Designed so business owners and staff can adopt software quickly and understand how their operational data fits together.",
  },
  {
    title: "Dependable foundation",
    detail:
      "Planned as reliable, structured applications that grow thoughtfully alongside real business needs.",
  },
];

export default function BusinessPage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline={division.tagline}
        description={division.overview}
      />

      <section className="py-16 sm:py-24 bg-white">
        <Container>
          <SectionHeading
            kicker="Future product areas"
            title="Areas of business software we aim to build."
            description="We are developing our vision for useful business software. Explore the areas of technology we aim to build."
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

      <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/50 py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-sm font-medium text-[#5C7E8F]">
                Product direction
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B] text-balance">
                How BinRo approaches business software.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-8">
              {BUSINESS_APPROACH.map((item, idx) => (
                <div key={item.title}>
                  <p className="font-mono text-xs text-[#5C7E8F] tabular-nums">
                    0{idx + 1}
                  </p>
                  <h3 className="mt-2.5 text-base font-semibold text-[#20272B]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A555C]">
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

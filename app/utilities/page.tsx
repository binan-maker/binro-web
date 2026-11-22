import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { ProductCard } from "@/components/divisions/ProductCard";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";

const division = getDivisionById("utilities");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/utilities",
  },
};

const DESIGN_GOALS = [
  {
    title: "Immediate clarity",
    detail:
      "Every tool is designed around one clear task without cluttered menus, confusing jargon, or unnecessary steps.",
  },
  {
    title: "Accessible anywhere",
    detail:
      "Focused digital utilities should run cleanly across desktop and mobile screens for students, professionals, and everyday users.",
  },
  {
    title: "Built progressively",
    detail:
      "Tools are planned and released thoughtfully as dependable standalone utilities rather than rushed feature bundles.",
  },
];

export default function UtilitiesPage() {
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
            kicker="Planned utility categories"
            title="Focused tools for everyday digital work."
            description="These categories represent upcoming areas of exploration for BinRo Utilities. Individual tools are still in planning and development."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B]">
                How BinRo approaches everyday utilities.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-8">
              {DESIGN_GOALS.map((goal, idx) => (
                <div key={goal.title}>
                  <p className="font-mono text-xs text-[#5C7E8F] tabular-nums">
                    0{idx + 1}
                  </p>
                  <h3 className="mt-2.5 text-base font-semibold text-[#20272B]">
                    {goal.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A555C]">
                    {goal.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="utilities" />
    </>
  );
}

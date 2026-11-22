import type { Metadata } from "next";
import {
  FEATURED_BUSINESS_PRODUCT,
  getDivisionById,
} from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { ProductCard } from "@/components/divisions/ProductCard";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";
import { ArrowUpRightIcon, BusinessMark } from "@/components/ui/Icons";

const division = getDivisionById("business");

export const metadata: Metadata = {
  title: division.name,
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/business",
  },
};

export default function BusinessPage() {
  const futureCategories = division.categories.filter(
    (category) => category.status === "Planned direction"
  );

  return (
    <>
      <DivisionHero
        division={division}
        headline={division.tagline}
        description={division.overview}
      >
        <ButtonLink
          href={FEATURED_BUSINESS_PRODUCT.ctaHref}
          variant="primary"
          size="lg"
          external
        >
          <span>{FEATURED_BUSINESS_PRODUCT.ctaLabel}</span>
          <ArrowUpRightIcon className="h-4 w-4" />
        </ButtonLink>
      </DivisionHero>

      {/* Clearly separated existing product direction */}
      <section className="py-16 sm:py-24 bg-white">
        <Container>
          <div className="rounded-2xl border border-[#5C7E8F]/45 bg-[#F3F6F7] p-7 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4DDE2] bg-white text-[#426579]">
                    <BusinessMark className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-[#426579]">
                    Existing product direction · Active application
                  </p>
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl text-balance">
                  BinRo Business — {FEATURED_BUSINESS_PRODUCT.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#4A555C]">
                  {FEATURED_BUSINESS_PRODUCT.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <ButtonLink
                    href={FEATURED_BUSINESS_PRODUCT.ctaHref}
                    variant="primary"
                    external
                  >
                    <span>Open business.binro.in</span>
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </ButtonLink>
                  <p className="text-xs text-[#4A555C]">
                    Separate dedicated application portal for accommodation
                    operators.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl border border-[#D4DDE2] bg-white p-6">
                  <h3 className="text-sm font-semibold text-[#20272B]">
                    Core operational areas
                  </h3>
                  <ul className="mt-4 divide-y divide-[#D4DDE2]/70">
                    {FEATURED_BUSINESS_PRODUCT.capabilities.map((item) => (
                      <li key={item.label} className="py-3.5 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-[#20272B]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#4A555C]">
                          {item.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Clearly separated future planned categories */}
      <section className="border-t border-[#D4DDE2] py-16 sm:py-24 bg-white">
        <Container>
          <SectionHeading
            kicker="Future planned directions"
            title="Expanding into broader operational software."
            description="Beyond PG and hostel operations management, BinRo Business intends to address daily operational software needs across additional sectors. These areas are planned for future development."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {futureCategories.map((category, index) => (
              <ProductCard
                key={category.title}
                category={category}
                index={index}
              />
            ))}
          </div>
        </Container>
      </section>

      <DivisionSiblings currentId="business" />
    </>
  );
}

import { FEATURED_BUSINESS_PRODUCT } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRightIcon, BusinessMark } from "@/components/ui/Icons";

export function FeaturedProducts() {
  return (
    <section className="border-y border-[#D4DDE2] bg-[#F3F6F7] py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-sm font-medium text-[#5C7E8F]">
              {FEATURED_BUSINESS_PRODUCT.division} ·{" "}
              {FEATURED_BUSINESS_PRODUCT.subtitle}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.125rem] lg:leading-[1.2] text-balance">
              {FEATURED_BUSINESS_PRODUCT.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4A555C] sm:text-[1.0625rem]">
              {FEATURED_BUSINESS_PRODUCT.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink
                href={FEATURED_BUSINESS_PRODUCT.ctaHref}
                variant="primary"
                size="lg"
                external
              >
                <span>{FEATURED_BUSINESS_PRODUCT.ctaLabel}</span>
                <ArrowUpRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/business" variant="secondary" size="lg">
                View Business division
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#D4DDE2] pb-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4DDE2] bg-[#F3F6F7] text-[#426579]">
                    <BusinessMark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#20272B]">
                      BinRo Business Application
                    </p>
                    <p className="text-xs text-[#5C7E8F]">business.binro.in</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#426579]">
                  External application
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {FEATURED_BUSINESS_PRODUCT.capabilities.map((item, idx) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 border-b border-[#D4DDE2]/60 pb-5 last:border-b-0 last:pb-0"
                  >
                    <span className="font-mono text-xs font-medium text-[#5C7E8F] pt-1 tabular-nums">
                      0{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#20272B]">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#4A555C]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

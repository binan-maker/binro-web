import Link from "next/link";
import { DIVISIONS } from "@/lib/divisions";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, DivisionIcon } from "@/components/ui/Icons";

export function FeaturedProducts() {
  return (
    <section className="border-y border-[#D4DDE2] bg-[#F3F6F7] py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#5C7E8F]">
              Product direction
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.125rem] lg:leading-[1.2] text-balance">
              Technology built around real needs.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4A555C] sm:text-[1.0625rem]">
              Across our four divisions, we aim to develop useful products that
              make everyday tasks easier, help businesses operate better,
              support developers and bring intelligent technology closer to
              people.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/about" variant="primary" size="lg">
                <span>Discover BinRo</span>
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#D4DDE2] bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#D4DDE2] pb-4">
                <p className="text-sm font-semibold text-[#20272B]">
                  Four areas of focus
                </p>
                <p className="text-xs font-medium text-[#5C7E8F]">
                  One unified company
                </p>
              </div>

              <div className="divide-y divide-[#D4DDE2]/75">
                {DIVISIONS.map((division) => (
                  <Link
                    key={division.id}
                    href={division.href}
                    className="group flex items-start justify-between gap-4 py-4 first:pt-5 last:pb-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-lg"
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D4DDE2] bg-[#F3F6F7] transition-colors duration-150 group-hover:border-[#5C7E8F] group-hover:bg-white"
                        style={{ color: division.accentColor }}
                      >
                        <DivisionIcon id={division.id} className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-[#20272B] group-hover:text-[#426579]">
                          {division.name}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[#4A555C]">
                          {division.tagline}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="mt-2 h-4 w-4 shrink-0 text-[#5C7E8F] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#20272B]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

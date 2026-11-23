import Link from "next/link";
import { COMPANY_PURPOSE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Purpose() {
  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/65 py-12 sm:py-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
              Long-term vision
            </p>
          </div>

          <div className="max-w-[62ch] lg:col-span-8">
            <h2 className="text-[clamp(1.375rem,1.15rem+1vw,1.75rem)] font-semibold leading-snug tracking-tight text-[#20272B] text-balance">
              {COMPANY_PURPOSE.ambitionHeadline}
            </h2>
            <p className="mt-3.5 text-base leading-relaxed text-[#556168] text-pretty">
              {COMPANY_PURPOSE.purpose}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#556168] text-pretty">
              We are building dependable products and original technology from
              India, designed to serve people and businesses globally over time.
            </p>
            <div className="mt-5">
              <Link
                href="/about"
                className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
              >
                <span>Read more about BinRo</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

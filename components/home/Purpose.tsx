import Link from "next/link";
import { COMPANY_PURPOSE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Purpose() {
  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7]/65 py-16 sm:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
              Purpose
            </p>
          </div>

          <div className="lg:col-span-8 max-w-2xl">
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-[#20272B] sm:text-3xl text-balance">
              We build useful technology that makes everyday life and work better.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#556168]">
              {COMPANY_PURPOSE.philosophy} {COMPANY_PURPOSE.ambition}
            </p>
            <div className="mt-7">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
              >
                <span>About BinRo</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

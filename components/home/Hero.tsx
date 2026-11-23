import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D4DDE2] bg-white py-12 sm:py-16 lg:py-22">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(65%_55%_at_50%_0%,rgba(243,246,247,0.95)_0%,rgba(255,255,255,0)_100%)]"
      />

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-[#466677]">
            BinRo · Technology for everyday life
          </p>

          <h1 className="mt-3.5 text-[clamp(1.875rem,1.35rem+2.2vw,3rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#20272B] text-balance">
            Technology should make life easier.
          </h1>

          <p className="mx-auto mt-4 max-w-[52ch] text-base leading-relaxed text-[#556168] sm:text-lg text-pretty">
            We build useful technology that helps people do more, solve
            problems, and access new possibilities.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/utilities" variant="primary" size="lg">
              <span>Explore Utilities</span>
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <Link
              href="/about"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DDE2] bg-white px-5 py-2.5 text-sm font-medium text-[#20272B] transition-all duration-150 hover:border-[#466677] hover:bg-[#F3F6F7] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:text-[0.9375rem]"
            >
              <span>Discover BinRo</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

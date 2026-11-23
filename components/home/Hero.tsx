import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D4DDE2] bg-white py-20 sm:py-28 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(65%_55%_at_50%_0%,rgba(243,246,247,0.95)_0%,rgba(255,255,255,0)_100%)]"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C7E8F]">
            BINRO
          </p>

          <h1 className="mt-5 text-[clamp(2.25rem,5.2vw,4rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#20272B] text-balance">
            Technology for everyday life.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#556168] sm:text-lg">
            Useful technology for people, professionals and businesses.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <ButtonLink href="#divisions" variant="primary" size="lg">
              <span>Explore BinRo</span>
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <Link
              href="/utilities"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DDE2] bg-white px-5 py-2.5 text-sm font-medium text-[#20272B] transition-all duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:text-[0.9375rem]"
            >
              <span>Browse Utilities</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

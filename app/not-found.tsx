import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="max-w-[54ch]">
          <p className="font-mono text-xs font-medium text-[#466677]">404</p>
          <h1 className="mt-3 text-[clamp(1.75rem,1.35rem+1.5vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#20272B] text-balance">
            Page not found.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#556168] text-pretty">
            The page you requested could not be found or has moved.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ButtonLink href="/" variant="primary">
              Go home
            </ButtonLink>
            <Link
              href="/utilities"
              className="inline-flex min-h-[44px] items-center rounded-sm px-2.5 py-2 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] sm:min-h-[40px]"
            >
              BinRo Utilities
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

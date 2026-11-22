import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="max-w-lg">
          <p className="font-mono text-xs text-[#5C7E8F]">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            Page not found.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#556168]">
            The page you requested could not be found or has moved.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ButtonLink href="/" variant="primary">
              Go home
            </ButtonLink>
            <Link
              href="/utilities"
              className="rounded-sm px-2 py-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              BinRo Utilities
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

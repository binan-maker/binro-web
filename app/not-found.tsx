import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="max-w-xl">
          <p className="text-sm font-medium text-[#5C7E8F]">404 · Page not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            This page could not be found.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#4A555C]">
            The page you requested may have moved or does not exist. You can
            return to the BinRo homepage or explore one of our four technology
            divisions.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/" variant="primary">
              Return to Home
            </ButtonLink>
            <Link
              href="/about"
              className="text-sm font-medium text-[#426579] hover:text-[#20272B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded px-2 py-1.5"
            >
              About BinRo
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

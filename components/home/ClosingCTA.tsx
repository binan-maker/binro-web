import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function ClosingCTA() {
  return (
    <section className="border-t border-[#D4DDE2] bg-[#F3F6F7] py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.25rem] text-balance">
            Let&apos;s make technology more useful.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#4A555C] sm:text-lg">
            Explore the possibilities across BinRo&apos;s four technology
            divisions.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="#divisions" variant="primary" size="lg">
              <span>Explore BinRo</span>
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

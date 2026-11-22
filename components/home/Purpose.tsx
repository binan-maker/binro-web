import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Purpose() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <p className="text-sm font-medium text-[#5C7E8F]">Our purpose</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.25rem] lg:leading-[1.18] text-balance">
              Technology should make people more capable.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4A555C] sm:text-lg">
              We believe useful technology should be accessible and
              understandable. Our aim is to help individuals and organisations
              benefit from technology, solve meaningful problems and achieve
              more.
            </p>
            <div className="mt-8">
              <ButtonLink href="/about" variant="secondary">
                <span>Learn about our vision</span>
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-7 sm:p-8">
              <p className="text-xs font-medium text-[#5C7E8F]">
                Core philosophy
              </p>
              <blockquote className="mt-4 font-display text-xl font-medium leading-snug text-[#20272B]">
                &ldquo;Technology should make people more capable, not more
                dependent on BinRo.&rdquo;
              </blockquote>
              <p className="mt-5 border-t border-[#D4DDE2] pt-5 text-sm leading-relaxed text-[#4A555C]">
                Building technology that empowers people, businesses and
                communities.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

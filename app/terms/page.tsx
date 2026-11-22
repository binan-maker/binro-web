import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms Information (Draft)",
  description:
    "Draft terms of use notice for the public BinRo website. Requires formal legal review prior to public launch.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
            Legal · Draft
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            Terms Information (Draft)
          </h1>

          <div className="mt-6 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/70 p-4 text-sm leading-relaxed text-[#20272B]">
            <p className="font-medium">
              Pre-launch draft — formal legal review required prior to launch.
            </p>
          </div>

          <div className="mt-10 space-y-8 border-t border-[#D4DDE2] pt-8 text-sm leading-relaxed text-[#556168] sm:text-[0.9375rem]">
            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                1. Informational purpose
              </h2>
              <p className="mt-2.5">
                Content published on{" "}
                <span className="font-mono text-xs">binro.in</span> provides
                general corporate information about BinRo and its four
                divisions: Utilities, Business, Developer, and Intelligence.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                2. Planned products and forward-looking descriptions
              </h2>
              <p className="mt-2.5">
                Descriptions of future areas across BinRo Utilities, BinRo
                Business, BinRo Developer, and BinRo Intelligence outline
                planned directions. Nothing on this website constitutes a
                binding commitment to release specific features, timelines, or
                pricing.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                3. Separate application terms
              </h2>
              <p className="mt-2.5">
                Use of standalone BinRo software applications or services may be
                governed by separate terms published alongside those products.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                4. Intellectual property
              </h2>
              <p className="mt-2.5">
                The BinRo name, website copy, visual design, and software
                presented on this site remain the property of BinRo unless
                otherwise noted.
              </p>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Confirm trademark status, permitted attribution, and
                copyright notice details prior to launch.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                5. Governing law and contact
              </h2>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Specify registered legal entity, governing law and
                jurisdiction in India, effective date, and official legal
                contact address after formal legal review.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}

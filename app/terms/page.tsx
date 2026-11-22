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
    <section className="py-16 sm:py-24 bg-white">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[#5C7E8F]">
            Legal documentation · Draft notice
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            Terms Information (Draft)
          </h1>

          <div className="mt-6 rounded-xl border border-[#5C7E8F]/45 bg-[#F3F6F7] p-5 text-sm leading-relaxed text-[#20272B]">
            <p className="font-semibold">
              Pre-launch draft — Legal review required
            </p>
            <p className="mt-1.5 text-[#4A555C]">
              This document is a draft placeholder outlining basic terms for the
              public BinRo informational website. It requires formal legal
              review and confirmation of company details before public launch.
            </p>
          </div>

          <div className="mt-12 space-y-10 border-t border-[#D4DDE2] pt-10 text-sm leading-relaxed text-[#4A555C] sm:text-base">
            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                1. Informational purpose
              </h2>
              <p className="mt-3">
                The content published on{" "}
                <span className="font-mono text-sm">binro.in</span> provides
                general corporate information about BinRo and its four
                technology divisions: BinRo Utilities, BinRo Business, BinRo
                Developer, and BinRo Intelligence.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                2. Planned products and forward-looking descriptions
              </h2>
              <p className="mt-3">
                Descriptions of future categories across BinRo Utilities, BinRo
                Business, BinRo Developer, and BinRo Intelligence represent
                planned areas of exploration and development. Nothing on this
                website constitutes a binding commitment to release specific
                features, timelines, or pricing.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                3. Separate application terms
              </h2>
              <p className="mt-3">
                Access to and use of any future standalone BinRo software
                applications or services will be governed by separate
                application-specific terms and policies published alongside
                those products.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                4. Intellectual property
              </h2>
              <p className="mt-3">
                The BinRo name, website copy, visual design, and architecture
                presented on this site remain the property of BinRo unless
                otherwise noted.
              </p>
              <p className="mt-3 text-sm text-[#426579]">
                TODO: Confirm trademark status, permitted attribution, and
                copyright notice details prior to launch.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                5. Governing law and contact
              </h2>
              <p className="mt-3 text-sm text-[#426579]">
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

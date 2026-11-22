import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Information (Draft)",
  description:
    "Draft privacy information notice for the public BinRo website. Requires formal review prior to public launch.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
            Legal · Draft
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            Privacy Information (Draft)
          </h1>

          <div className="mt-6 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/70 p-4 text-sm leading-relaxed text-[#20272B]">
            <p className="font-medium">
              Pre-launch draft — formal legal review required prior to launch.
            </p>
          </div>

          <div className="mt-10 space-y-8 border-t border-[#D4DDE2] pt-8 text-sm leading-relaxed text-[#556168] sm:text-[0.9375rem]">
            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                1. Scope of this public website
              </h2>
              <p className="mt-2.5">
                This website (<span className="font-mono text-xs">binro.in</span>
                ) serves as the public company website for BinRo. It does not
                include user registration, login accounts, user databases, or
                payment processing.
              </p>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Confirm separate privacy documentation and link references
                for any future standalone BinRo products prior to launch.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                2. Client-side utility processing
              </h2>
              <p className="mt-2.5">
                Tools such as BinRo Image Resizer process files directly inside
                your browser. Selected images are not uploaded to BinRo servers.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                3. Information collection and server logs
              </h2>
              <p className="mt-2.5">
                This website does not collect personal profile data through
                forms or sign-ups. Hosting infrastructure may automatically
                process routine technical request metadata (such as IP address,
                user-agent, or timestamps) strictly for delivery and security.
              </p>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Verify exact hosting provider, CDN, and log retention
                policies prior to launch.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                4. Cookies and analytics
              </h2>
              <p className="mt-2.5">
                No third-party advertising trackers or marketing cookies are
                configured in this codebase.
              </p>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Document whether privacy-preserving analytics or
                essential cookies are enabled at deployment, and add consent
                notices if applicable.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#20272B]">
                5. Legal entity and privacy contact
              </h2>
              <p className="mt-2.5 text-sm text-[#426579]">
                TODO: Insert registered entity name, jurisdiction (India),
                effective date, and verified privacy contact channel after legal
                review.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}

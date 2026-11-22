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
    <section className="py-16 sm:py-24 bg-white">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[#5C7E8F]">
            Legal documentation · Draft notice
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#20272B] sm:text-4xl text-balance">
            Privacy Information (Draft)
          </h1>

          <div className="mt-6 rounded-xl border border-[#5C7E8F]/45 bg-[#F3F6F7] p-5 text-sm leading-relaxed text-[#20272B]">
            <p className="font-semibold">
              Pre-launch draft — Legal review required
            </p>
            <p className="mt-1.5 text-[#4A555C]">
              This document is a working placeholder prepared for website
              structure and clarity. It has not undergone formal legal review
              and must be finalised with verified company, hosting, and data
              handling details before public launch.
            </p>
          </div>

          <div className="mt-12 space-y-10 border-t border-[#D4DDE2] pt-10 text-sm leading-relaxed text-[#4A555C] sm:text-base">
            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                1. Scope of this public website
              </h2>
              <p className="mt-3">
                This website (<span className="font-mono text-sm">binro.in</span>
                ) serves solely as the public company information website for
                BinRo. It does not include user registration, login accounts,
                databases, or payment processing.
              </p>
              <p className="mt-3 text-sm text-[#426579]">
                TODO: Confirm separate privacy documentation and link references
                for standalone products such as BinRo Business (
                <span className="font-mono">business.binro.in</span>).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                2. Information collection and server logs
              </h2>
              <p className="mt-3">
                This website does not intentionally collect personal profile
                data through forms or account sign-ups. Standard web server or
                hosting infrastructure may automatically process routine technical
                request metadata (such as IP address, user-agent, or timestamps)
                strictly for delivery and security.
              </p>
              <p className="mt-3 text-sm text-[#426579]">
                TODO: Verify exact hosting provider, CDN, and log retention
                policies prior to launch.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                3. Cookies and analytics
              </h2>
              <p className="mt-3">
                No third-party advertising trackers or marketing cookies are
                configured in this codebase.
              </p>
              <p className="mt-3 text-sm text-[#426579]">
                TODO: Document whether privacy-preserving analytics or
                essential cookies are enabled at deployment, and add consent
                notices if applicable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                4. External links
              </h2>
              <p className="mt-3">
                Pages on this website link to the external BinRo Business
                application (<span className="font-mono text-sm">business.binro.in</span>).
                Use of separate applications is governed by the terms and privacy
                practices specific to those applications.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#20272B]">
                5. Legal entity and privacy contact
              </h2>
              <p className="mt-3 text-sm text-[#426579]">
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

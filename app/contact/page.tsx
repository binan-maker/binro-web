import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowUpRightIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact BinRo",
  description:
    "Enquiry channels and contact information guidance for BinRo across general, product, partnership, and developer enquiries.",
  alternates: {
    canonical: "/contact",
  },
};

const ENQUIRY_CHANNELS = [
  {
    index: "01",
    title: "General enquiries",
    description:
      "Questions regarding BinRo as a company, our purpose, or general organisational communication.",
    status: "Direct email channel to be published prior to public launch.",
  },
  {
    index: "02",
    title: "Product enquiries",
    description:
      "Questions about BinRo Business or upcoming directions across BinRo Utilities and BinRo Intelligence.",
    status:
      "Existing BinRo Business operators can access the dedicated application portal directly.",
  },
  {
    index: "03",
    title: "Business partnerships",
    description:
      "Collaborations with accommodation operators, local enterprises, and technology partners.",
    status: "Partnership contact details to be published prior to public launch.",
  },
  {
    index: "04",
    title: "Developer and integration enquiries",
    description:
      "Technical enquiries regarding future BinRo Developer APIs, SDKs, and integration workflows.",
    status: "Developer contact routing to be published prior to public launch.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7] to-white py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#5C7E8F]">Contact BinRo</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.12] tracking-tight text-[#20272B] text-balance">
              Get in touch with BinRo.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#4A555C] sm:text-lg">
              Direct enquiry channels for general communication, product
              questions, business partnerships, and developer integrations.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <Container>
          {/* Honest pre-launch notice without fake interactive form */}
          <div className="rounded-2xl border border-[#5C7E8F]/45 bg-[#F3F6F7] p-7 sm:p-9">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="text-xs font-medium text-[#5C7E8F]">
                  Contact information placeholder · Pre-launch notice
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#20272B] sm:text-2xl">
                  Official communication channels are being finalised.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#4A555C] sm:text-base">
                  To avoid publishing unverified addresses or a non-functional
                  enquiry form, direct email addresses and contact routing will
                  be added here before public launch.
                </p>
              </div>
              <div className="lg:col-span-4 lg:flex lg:justify-end">
                <ButtonLink
                  href={SITE_CONFIG.businessAppUrl}
                  variant="primary"
                  external
                >
                  <span>Visit BinRo Business</span>
                  <ArrowUpRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* Structured enquiry directory */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {ENQUIRY_CHANNELS.map((channel) => (
              <div
                key={channel.index}
                className="flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-7"
              >
                <div>
                  <p className="font-mono text-xs font-medium text-[#5C7E8F] tabular-nums">
                    {channel.index}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-[#20272B]">
                    {channel.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
                    {channel.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#D4DDE2]/80 pt-4">
                  <p className="text-xs font-medium text-[#426579]">
                    {channel.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-[#D4DDE2] pt-8 text-sm text-[#4A555C]">
            <p>
              Looking for information on BinRo&apos;s company structure and
              principles?{" "}
              <Link
                href="/about"
                className="font-medium text-[#426579] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
              >
                Read About BinRo
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact BinRo",
  description:
    "Enquiry areas for general communication, product questions, partnerships, and developer integrations at BinRo.",
  alternates: {
    canonical: "/contact",
  },
};

const ENQUIRY_CHANNELS = [
  {
    index: "01",
    title: "General enquiries",
    description:
      "Company information, press, and general organisational communication.",
  },
  {
    index: "02",
    title: "Product enquiries",
    description:
      "Questions regarding BinRo Utilities and upcoming products across Business and Intelligence.",
  },
  {
    index: "03",
    title: "Business partnerships",
    description:
      "Collaborations with organisations, local enterprises, and technology partners.",
  },
  {
    index: "04",
    title: "Developer enquiries",
    description:
      "Questions about future BinRo Developer tools, APIs, and integrations.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-14 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5C7E8F]">
              Contact
            </p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.125rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#20272B] text-balance">
              Get in touch with BinRo.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#556168] sm:text-lg">
              Direct email channels and enquiry routing are being finalised
              ahead of public launch.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-lg font-semibold tracking-tight text-[#20272B]">
                Enquiry areas
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#556168]">
                Verified addresses for each area will be published here before
                public launch.
              </p>
              <div className="mt-6">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                >
                  <span>About BinRo</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="divide-y divide-[#D4DDE2] border-y border-[#D4DDE2] lg:col-span-8">
              {ENQUIRY_CHANNELS.map((channel) => (
                <div
                  key={channel.index}
                  className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-[#A2A2A2] tabular-nums">
                      {channel.index}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#20272B]">
                        {channel.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#556168]">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <p className="pl-8 text-xs font-medium text-[#5C7E8F] whitespace-nowrap sm:pl-0">
                    To be published
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

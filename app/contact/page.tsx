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
      <section className="border-b border-[#D4DDE2] bg-gradient-to-b from-[#F3F6F7]/80 to-white py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="max-w-[62ch]">
            <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
              Contact
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,1.35rem+1.5vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[#20272B] text-balance">
              Get in touch with BinRo.
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-[#556168] text-pretty sm:text-lg">
              Direct email channels and enquiry routing are being finalised
              ahead of public launch.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-lg font-semibold tracking-tight text-[#20272B]">
                Enquiry areas
              </h2>
              <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[#556168] text-pretty">
                Verified addresses for each area will be published here before
                public launch.
              </p>
              <div className="mt-5">
                <Link
                  href="/about"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm py-1 text-sm font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
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
                    <span className="font-mono text-xs font-medium text-[#556168] tabular-nums">
                      {channel.index}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#20272B]">
                        {channel.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#556168] text-pretty">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <p className="pl-8 text-xs font-medium text-[#466677] sm:shrink-0 sm:pl-0">
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

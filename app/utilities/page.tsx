import type { Metadata } from "next";
import { getDivisionById } from "@/lib/divisions";
import { SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { DivisionHero } from "@/components/divisions/DivisionHero";
import { DivisionSiblings } from "@/components/divisions/DivisionSiblings";
import { UtilitiesDirectory } from "@/components/utilities/UtilitiesDirectory";

const division = getDivisionById("utilities");

export const metadata: Metadata = {
  title: division.name,
  description:
    "Everyday technology, made simple. Useful digital tools that help people complete everyday tasks more easily, privately and efficiently.",
  alternates: {
    canonical: "/utilities",
  },
  openGraph: {
    title: `${division.name} | ${SITE_CONFIG.name}`,
    description:
      "Everyday technology, made simple. Useful digital tools that help people complete everyday tasks more easily, privately and efficiently.",
    url: `${SITE_CONFIG.url}/utilities`,
  },
};

export default function UtilitiesPage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline="Everyday technology, made simple."
        description="Useful digital tools that help people complete everyday tasks more easily, privately and efficiently."
      />

      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <UtilitiesDirectory />
        </Container>
      </section>

      <DivisionSiblings currentId="utilities" />
    </>
  );
}

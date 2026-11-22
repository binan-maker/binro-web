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
  description: `${division.tagline} ${division.overview}`,
  alternates: {
    canonical: "/utilities",
  },
  openGraph: {
    title: `${division.name} | ${SITE_CONFIG.name}`,
    description: `${division.tagline} ${division.overview}`,
    url: `${SITE_CONFIG.url}/utilities`,
  },
};

export default function UtilitiesPage() {
  return (
    <>
      <DivisionHero
        division={division}
        headline={division.tagline}
        description={division.overview}
      />

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <UtilitiesDirectory />
        </Container>
      </section>

      <DivisionSiblings currentId="utilities" />
    </>
  );
}

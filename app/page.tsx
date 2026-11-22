import { Hero } from "@/components/home/Hero";
import { Divisions } from "@/components/home/Divisions";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Purpose } from "@/components/home/Purpose";
import { Approach } from "@/components/home/Approach";
import { GlobalPerspective } from "@/components/home/GlobalPerspective";
import { ClosingCTA } from "@/components/home/ClosingCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Divisions />
      <FeaturedProducts />
      <Purpose />
      <Approach />
      <GlobalPerspective />
      <ClosingCTA />
    </>
  );
}

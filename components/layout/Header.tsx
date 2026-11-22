import Link from "next/link";
import { HEADER_CONTACT_LINK, SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#D4DDE2] bg-white/90 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-8">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-[0.14em] text-[#20272B] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-4 focus-visible:ring-offset-white rounded-sm"
        >
          {SITE_CONFIG.name}
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={HEADER_CONTACT_LINK.href}
            className="hidden md:inline-flex items-center justify-center rounded-lg border border-[#D4DDE2] bg-white px-4 py-2 text-sm font-medium text-[#20272B] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Get in touch
          </Link>
          <MobileNavigation />
        </div>
      </Container>
    </header>
  );
}

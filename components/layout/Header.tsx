import Link from "next/link";
import { HEADER_CONTACT_LINK, SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#D4DDE2]/85 bg-white/90 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-[0.16em] text-[#20272B] whitespace-nowrap shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        >
          {SITE_CONFIG.name}
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={HEADER_CONTACT_LINK.href}
            className="hidden md:inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-sm font-medium text-[#20272B] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {HEADER_CONTACT_LINK.label}
          </Link>
          <MobileNavigation />
        </div>
      </Container>
    </header>
  );
}

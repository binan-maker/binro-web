"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_CONTACT_LINK, SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export function HeaderShell() {
  const pathname = usePathname() ?? "/";
  const isToolPage = /^\/utilities\/[^/]+/.test(pathname);

  if (isToolPage) {
    return (
      <Container className="flex h-full items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm text-base font-semibold tracking-[0.16em] text-[#20272B] whitespace-nowrap shrink-0 transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        >
          <span>{SITE_CONFIG.name}</span>
        </Link>

        <Link
          href="/utilities"
          className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#426579] whitespace-nowrap shrink-0 transition-all duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] hover:text-[#20272B] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:text-sm"
        >
          All tools
        </Link>
      </Container>
    );
  }

  return (
    <Container className="flex h-full items-center justify-between gap-6">
      <Link
        href="/"
        className="text-base font-semibold tracking-[0.16em] text-[#20272B] whitespace-nowrap shrink-0 rounded-sm transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-4 focus-visible:ring-offset-white"
      >
        {SITE_CONFIG.name}
      </Link>

      <DesktopNav />

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href={HEADER_CONTACT_LINK.href}
          className="hidden md:inline-flex min-h-[38px] items-center justify-center rounded-xl border border-[#D4DDE2] bg-white px-3.5 py-1.5 text-sm font-medium text-[#20272B] whitespace-nowrap shrink-0 transition-all duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {HEADER_CONTACT_LINK.label}
        </Link>
        <MobileNavigation />
      </div>
    </Container>
  );
}

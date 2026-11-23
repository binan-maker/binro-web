"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/site";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden md:flex flex-wrap items-center gap-x-5 gap-y-1 lg:gap-x-7"
    >
      {PRIMARY_NAV.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative inline-flex min-h-[44px] items-center py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-sm ${
              isActive
                ? "text-[#20272B]"
                : "text-[#556168] hover:text-[#20272B]"
            }`}
          >
            {item.label}
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[2px] bg-[#426579]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

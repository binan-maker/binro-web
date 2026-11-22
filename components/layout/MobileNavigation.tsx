"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_CONTACT_LINK, PRIMARY_NAV } from "@/lib/site";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";

export function MobileNavigation() {
  const pathname = usePathname();
  const [openForPathname, setOpenForPathname] = useState<string | null>(null);
  const isOpen = openForPathname === pathname;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenForPathname(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() =>
          setOpenForPathname((prev) => (prev === pathname ? null : pathname))
        }
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4DDE2] bg-white text-[#20272B] transition-colors duration-150 hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
      >
        {isOpen ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </button>

      {isOpen ? (
        <div
          id="mobile-navigation-panel"
          className="fixed inset-x-0 top-16 z-40 border-b border-[#D4DDE2] bg-white/95 backdrop-blur-md shadow-sm"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto max-w-[1120px] px-5 py-4 flex flex-col gap-1"
          >
            {PRIMARY_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpenForPathname(null)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    isActive
                      ? "bg-[#F3F6F7] text-[#20272B]"
                      : "text-[#556168] hover:bg-[#F3F6F7] hover:text-[#20272B]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="text-xs font-medium text-[#426579]">
                      Current
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-[#D4DDE2] pt-3">
              <Link
                href={HEADER_CONTACT_LINK.href}
                onClick={() => setOpenForPathname(null)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#426579] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                {HEADER_CONTACT_LINK.label}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

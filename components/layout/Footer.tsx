import { cacheLife } from "next/cache";
import Link from "next/link";
import { FOOTER_GROUPS, SITE_CONFIG } from "@/lib/site";
import { Container } from "@/components/ui/Container";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <span>{new Date().getFullYear()}</span>;
}

export function Footer() {
  return (
    <footer className="border-t border-[#D4DDE2] bg-[#F3F6F7] text-[#20272B]">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-block font-display text-lg font-bold tracking-[0.14em] text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
            >
              {SITE_CONFIG.name}
            </Link>
            <p className="mt-3 text-base font-medium text-[#20272B]">
              {SITE_CONFIG.tagline}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#4A555C]">
              One technology company bringing together everyday utilities,
              business software, developer tools, and applied intelligence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5C7E8F]">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#4A555C] transition-colors duration-150 hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#D4DDE2] pt-8 text-xs text-[#4A555C] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <CopyrightYear /> {SITE_CONFIG.legalName}. All rights
            reserved.
          </p>
          <p>Built in India with a global perspective.</p>
        </div>
      </Container>
    </footer>
  );
}

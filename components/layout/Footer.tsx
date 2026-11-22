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
    <footer className="border-t border-[#D4DDE2] bg-[#F3F6F7]/75 text-[#20272B]">
      <Container className="py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-block text-base font-semibold tracking-[0.16em] text-[#20272B] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
            >
              {SITE_CONFIG.name}
            </Link>
            <p className="mt-2.5 text-sm text-[#556168]">
              {SITE_CONFIG.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
                  {group.title}
                </h2>
                <ul className="mt-3.5 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block py-0.5 text-sm text-[#556168] transition-colors duration-150 hover:text-[#20272B] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
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

        <div className="mt-10 flex flex-col gap-2 border-t border-[#D4DDE2] pt-6 text-xs text-[#556168] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <CopyrightYear /> {SITE_CONFIG.legalName}
          </p>
          <p>India</p>
        </div>
      </Container>
    </footer>
  );
}

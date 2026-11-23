import Link from "next/link";
import { UTILITY_TOOLS } from "@/lib/utilities";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function UtilitiesDirectory() {
  const availableTools = UTILITY_TOOLS.filter(
    (tool) => tool.status === "available"
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
      {availableTools.map((tool) => (
        <Link
          key={tool.id}
          href={tool.href}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7]/45 p-5 transition-all duration-150 hover:border-[#466677] hover:bg-[#F3F6F7] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:p-6"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-[#1CC8A0] transition-transform duration-200 group-hover:scale-x-100"
          />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#20272B] sm:text-xl">
              {tool.shortTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#556168] text-pretty">
              {tool.shortDescription}
            </p>
          </div>

          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors group-hover:text-[#20272B]">
            <span>Open tool</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}

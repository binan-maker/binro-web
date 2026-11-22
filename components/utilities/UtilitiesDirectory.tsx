import Link from "next/link";
import { UTILITY_TOOLS } from "@/lib/utilities";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function UtilitiesDirectory() {
  const availableTools = UTILITY_TOOLS.filter(
    (tool) => tool.status === "available"
  );

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {availableTools.map((tool) => (
        <Link
          key={tool.id}
          href={tool.href}
          className="group flex min-h-[164px] flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7]/50 p-6 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:p-8"
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#20272B]">
              {tool.shortTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#556168]">
              {tool.shortDescription}
            </p>
          </div>

          <div className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#426579] transition-colors group-hover:text-[#20272B]">
            <span>Open tool</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}

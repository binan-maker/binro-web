"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UTILITY_CATEGORIES,
  UTILITY_TOOLS,
  getUtilityCategoryById,
  type UtilityCategoryId,
} from "@/lib/utilities";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/Icons";

type CategoryFilter = "all" | UtilityCategoryId;

export function UtilitiesDirectory() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    return UTILITY_TOOLS.filter((tool) => {
      if (
        selectedCategory !== "all" &&
        tool.categoryId !== selectedCategory
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const category = getUtilityCategoryById(tool.categoryId);
      const searchableText = [
        tool.name,
        tool.description,
        category?.name ?? "",
        ...tool.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [selectedCategory, normalizedQuery]);

  const activeCategoryObj =
    selectedCategory === "all"
      ? null
      : getUtilityCategoryById(selectedCategory);

  return (
    <div className="space-y-14">
      {/* Search and category filter bar */}
      <div className="flex flex-col gap-4 border-b border-[#D4DDE2] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <label htmlFor="utilities-search" className="sr-only">
            Search BinRo Utilities tools
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C7E8F]" />
          <input
            id="utilities-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search utilities"
            className="min-h-[40px] w-full rounded-lg border border-[#D4DDE2] bg-white py-2 pl-10 pr-3.5 text-sm text-[#20272B] placeholder:text-[#78858D] focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/25"
          />
        </div>

        <div
          role="group"
          aria-label="Filter tools by category"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            aria-pressed={selectedCategory === "all"}
            className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
              selectedCategory === "all"
                ? "bg-[#426579] text-white"
                : "bg-[#F3F6F7] text-[#556168] hover:text-[#20272B]"
            }`}
          >
            All
          </button>

          {UTILITY_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={isSelected}
                className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                  isSelected
                    ? "bg-[#426579] text-white"
                    : "bg-[#F3F6F7] text-[#556168] hover:text-[#20272B]"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Tools */}
      {filteredTools.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium uppercase tracking-[0.06em] text-[#5C7E8F]">
              {activeCategoryObj ? activeCategoryObj.name : "Available tools"}
            </h2>
            <p className="font-mono text-xs text-[#A2A2A2] tabular-nums">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredTools.map((tool) => {
              const category = getUtilityCategoryById(tool.categoryId);

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7]/65 p-6 transition-colors duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 sm:p-7"
                >
                  <div>
                    <p className="text-xs font-medium text-[#5C7E8F]">
                      {category?.name ?? "Utility"} · Available
                    </p>
                    <h3 className="mt-2.5 text-xl font-semibold tracking-tight text-[#20272B]">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#556168]">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-[#426579] group-hover:text-[#20272B]">
                    <span>Open tool</span>
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7]/50 px-6 py-10 text-center"
        >
          <p className="text-base font-medium text-[#20272B]">
            {normalizedQuery
              ? `No tools matched "${searchQuery.trim()}".`
              : `No tools released in ${activeCategoryObj?.name ?? "this category"} yet.`}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#556168]">
            {activeCategoryObj && !normalizedQuery
              ? activeCategoryObj.description
              : "Try another search term or view all tools."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {normalizedQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="min-h-[38px] rounded-lg bg-[#426579] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#355364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Clear search
              </button>
            ) : null}
            {selectedCategory !== "all" ? (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="min-h-[38px] rounded-lg border border-[#D4DDE2] bg-white px-4 py-1.5 text-sm font-medium text-[#20272B] transition-colors hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Show all
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Clean hairline directory of planned utility categories */}
      <div className="border-t border-[#D4DDE2] pt-12">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#20272B]">
            Utility categories
          </h2>
          <p className="text-xs text-[#556168]">
            New tools are added here as each utility is completed.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITY_CATEGORIES.map((category) => {
            const toolsInCat = UTILITY_TOOLS.filter(
              (t) => t.categoryId === category.id && t.status === "available"
            );

            return (
              <div
                key={category.id}
                className="border-t border-[#D4DDE2] pt-4"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-[#A2A2A2] tabular-nums">
                    {category.code}
                  </span>
                  <span className="text-[#5C7E8F]">
                    {toolsInCat.length > 0
                      ? `${toolsInCat.length} available`
                      : "Planned"}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[#20272B]">
                  {category.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#556168]">
                  {category.description}
                </p>
                {toolsInCat.length > 0 ? (
                  <div className="mt-3">
                    {toolsInCat.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#426579] transition-colors hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
                      >
                        <span>{tool.name}</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

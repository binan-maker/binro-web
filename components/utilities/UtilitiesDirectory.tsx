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
    <div className="space-y-12">
      {/* Search and category filter controls */}
      <div className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="utilities-search" className="sr-only">
              Search BinRo Utilities tools
            </label>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C7E8F]" />
            <input
              id="utilities-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools (e.g. image resizer, photo)"
              className="w-full rounded-lg border border-[#D4DDE2] bg-white py-2.5 pl-10 pr-4 text-sm text-[#20272B] placeholder:text-[#78858D] focus:border-[#5C7E8F] focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30"
            />
          </div>

          <div
            role="group"
            aria-label="Filter tools by category"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                selectedCategory === "all"
                  ? "bg-[#426579] text-white"
                  : "border border-[#D4DDE2] bg-white text-[#4A555C] hover:border-[#5C7E8F] hover:text-[#20272B]"
              }`}
            >
              All ({UTILITY_TOOLS.length})
            </button>

            {UTILITY_CATEGORIES.map((category) => {
              const count = UTILITY_TOOLS.filter(
                (t) => t.categoryId === category.id
              ).length;
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={isSelected}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] ${
                    isSelected
                      ? "bg-[#426579] text-white"
                      : "border border-[#D4DDE2] bg-white text-[#4A555C] hover:border-[#5C7E8F] hover:text-[#20272B]"
                  }`}
                >
                  {category.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Directory results or helpful empty state */}
      {filteredTools.length > 0 ? (
        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-[#D4DDE2] pb-4">
            <h2 className="text-lg font-semibold text-[#20272B]">
              {activeCategoryObj ? activeCategoryObj.name : "Available tools"}
            </h2>
            <p className="text-xs text-[#5C7E8F] tabular-nums">
              Showing {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => {
              const category = getUtilityCategoryById(tool.categoryId);
              const isAvailable = tool.status === "available";

              if (isAvailable) {
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-6 transition-all duration-150 hover:border-[#5C7E8F] hover:bg-[#F3F6F7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-[#5C7E8F]">
                          {category?.name ?? "Utility"} · Available
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#20272B] group-hover:text-[#426579]">
                        {tool.name}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
                        {tool.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-[#D4DDE2]/80 pt-4 text-sm font-medium text-[#426579] group-hover:text-[#20272B]">
                      <span>Open tool</span>
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              }

              return (
                <article
                  key={tool.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#D4DDE2] bg-white p-6"
                >
                  <div>
                    <p className="text-xs font-medium text-[#5C7E8F]">
                      {category?.name ?? "Utility"} · Coming soon
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#20272B]">
                      {tool.name}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
                      {tool.description}
                    </p>
                  </div>

                  <p className="mt-6 border-t border-[#D4DDE2]/80 pt-4 text-xs font-medium text-[#5C7E8F]">
                    Coming soon
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7]/70 p-8 sm:p-10 text-center"
        >
          <p className="text-sm font-medium text-[#5C7E8F]">
            {normalizedQuery
              ? "No matching tools"
              : "Category in planning"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#20272B]">
            {normalizedQuery
              ? `No tools matched "${searchQuery.trim()}".`
              : `No tools have been released in ${activeCategoryObj?.name ?? "this category"} yet.`}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#4A555C]">
            {activeCategoryObj && !normalizedQuery
              ? `${activeCategoryObj.description} BinRo adds tools here progressively once each working utility is built and verified.`
              : "Try another search term or view all available tools in the BinRo Utilities directory."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {normalizedQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-lg bg-[#426579] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#355364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Clear search
              </button>
            ) : null}
            {selectedCategory !== "all" ? (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="rounded-lg border border-[#D4DDE2] bg-white px-4 py-2 text-sm font-medium text-[#20272B] transition-colors duration-150 hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Show all categories
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Overview of the six directory categories */}
      <div className="border-t border-[#D4DDE2] pt-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#5C7E8F]">
            Directory structure
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#20272B] text-balance">
            Six utility categories under BinRo Utilities.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4A555C] sm:text-base">
            The directory is organised across six everyday task areas and grows
            naturally as each real tool is completed.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITY_CATEGORIES.map((category) => {
            const toolsInCat = UTILITY_TOOLS.filter(
              (t) => t.categoryId === category.id && t.status === "available"
            );

            return (
              <div
                key={category.id}
                className="flex flex-col justify-between rounded-xl border border-[#D4DDE2] bg-white p-5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-[#5C7E8F]">
                      Category {category.code}
                    </span>
                    <span className="text-[#4A555C] tabular-nums">
                      {toolsInCat.length > 0
                        ? `${toolsInCat.length} available`
                        : "No tools released yet"}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-base font-semibold text-[#20272B]">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A555C]">
                    {category.description}
                  </p>
                </div>

                {toolsInCat.length > 0 ? (
                  <div className="mt-4 border-t border-[#D4DDE2]/80 pt-3">
                    {toolsInCat.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#426579] hover:text-[#20272B] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] rounded-sm"
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

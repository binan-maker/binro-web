import type { ProductCategory } from "@/lib/divisions";

interface DivisionAreasProps {
  categories: ProductCategory[];
  columns?: 2 | 4;
}

export function DivisionAreas({
  categories,
  columns = 2,
}: DivisionAreasProps) {
  const gridClass =
    columns === 4
      ? "grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 gap-x-12 gap-y-9 md:grid-cols-2";

  return (
    <div className={`grid ${gridClass}`}>
      {categories.map((category, index) => (
        <article
          key={category.title}
          className="border-t border-[#D4DDE2] pt-4 sm:pt-5"
        >
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-[#466677]">
              {category.group ?? "Future area"}
            </span>
            <span className="font-mono font-medium text-[#556168] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-[#20272B] sm:text-lg">
            {category.title}
          </h3>
          <p className="mt-1.5 max-w-[56ch] text-sm leading-relaxed text-[#556168] text-pretty">
            {category.description}
          </p>
        </article>
      ))}
    </div>
  );
}

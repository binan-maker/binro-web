import type { ProductCategory } from "@/lib/divisions";

interface ProductCardProps {
  category: ProductCategory;
  index?: number;
}

export function ProductCard({ category, index }: ProductCardProps) {
  const isActive = category.status === "Active direction";

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-colors duration-150 ${
        isActive
          ? "border-[#5C7E8F] bg-[#F3F6F7]"
          : "border-[#D4DDE2] bg-white hover:border-[#5C7E8F]/70"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-[#5C7E8F]">
            {category.group ? category.group : "Product area"}
          </span>
          {typeof index === "number" ? (
            <span className="font-mono text-[#A2A2A2] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#20272B]">
          {category.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-[#4A555C]">
          {category.description}
        </p>
      </div>

      <p className="mt-6 border-t border-[#D4DDE2]/80 pt-3.5 text-xs font-medium text-[#426579]">
        {category.status}
      </p>
    </article>
  );
}

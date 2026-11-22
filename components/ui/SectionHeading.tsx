interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  titleAs = "h2",
  className = "",
}: SectionHeadingProps) {
  const HeadingTag = titleAs;
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-xl ${alignment} ${className}`}>
      {kicker ? (
        <p className="text-xs font-medium tracking-wide uppercase text-[#5C7E8F]">
          {kicker}
        </p>
      ) : null}
      <HeadingTag
        className={`${kicker ? "mt-2.5" : ""} text-2xl font-semibold tracking-tight text-[#20272B] sm:text-[1.875rem] sm:leading-[1.2] text-balance`}
      >
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#556168] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

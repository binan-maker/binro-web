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
    <div className={`max-w-[62ch] ${alignment} ${className}`}>
      {kicker ? (
        <p className="text-xs font-medium tracking-[0.04em] text-[#466677]">
          {kicker}
        </p>
      ) : null}
      <HeadingTag
        className={`${kicker ? "mt-2" : ""} text-[clamp(1.375rem,1.15rem+1vw,1.875rem)] font-semibold leading-[1.2] tracking-tight text-[#20272B] text-balance`}
      >
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-[#556168] sm:text-base text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}

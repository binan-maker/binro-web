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
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {kicker ? (
        <p className="text-sm font-medium tracking-normal text-[#5C7E8F]">
          {kicker}
        </p>
      ) : null}
      <HeadingTag
        className={`${kicker ? "mt-3" : ""} text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.125rem] lg:leading-[1.2] text-balance`}
      >
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-[#4A555C] sm:text-[1.0625rem]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

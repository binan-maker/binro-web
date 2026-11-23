import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#426579] text-white border border-[#426579] hover:bg-[#355364] hover:border-[#355364]",
  secondary:
    "bg-white text-[#20272B] border border-[#D4DDE2] hover:border-[#5C7E8F] hover:bg-[#F3F6F7]",
  ghost:
    "bg-transparent text-[#426579] border border-transparent hover:bg-[#F3F6F7] hover:text-[#20272B]",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-[44px] px-4 py-2 text-sm sm:min-h-[40px]",
  lg: "min-h-[44px] px-5 py-2.5 text-sm sm:text-[0.9375rem]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  className = "",
}: ButtonLinkProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl font-medium text-center transition-all duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

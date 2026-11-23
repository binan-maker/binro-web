import { HeaderShell } from "@/components/layout/HeaderShell";

export function Header() {
  return (
    <header className="sticky top-0 z-40 min-h-14 border-b border-[#D4DDE2]/85 bg-white/95 backdrop-blur-md sm:min-h-16">
      <HeaderShell />
    </header>
  );
}

import { HeaderShell } from "@/components/layout/HeaderShell";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#D4DDE2]/85 bg-white/92 backdrop-blur-md">
      <HeaderShell />
    </header>
  );
}

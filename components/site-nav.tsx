import Link from "next/link";
import { Anchor, BookOpen, Plus, Search } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklch,var(--background)_88%,transparent)] backdrop-blur">
      <div className="container-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid size-8 place-items-center rounded-[var(--radius)] bg-[var(--ink)] text-[var(--background)]">
            <Anchor size={17} aria-hidden />
          </span>
          <span>Freeport</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link className="button-ghost hidden sm:inline-flex" href="/listings">
            <Search size={16} aria-hidden />
            Browse
          </Link>
          <Link className="button-ghost hidden sm:inline-flex" href="/docs/agents">
            <BookOpen size={16} aria-hidden />
            Docs
          </Link>
          <Link className="button-secondary" href="/onboard">
            <Plus size={16} aria-hidden />
            Onboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

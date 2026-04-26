import Link from "next/link";
import { Anchor, BookOpen, Plus, Search } from "lucide-react";

export function SiteNav() {
  return (
    <header className="site-shell sticky top-0 z-20 border-b border-[color-mix(in_oklch,var(--accent)_32%,var(--ink))]">
      <div className="container-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-black">
          <span className="nav-brand-mark grid size-8 place-items-center rounded-[var(--radius)]">
            <Anchor size={17} aria-hidden />
          </span>
          <span className="display-type text-lg">Freeport</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link className="button-ghost nav-link nav-secondary" href="/listings">
            <Search size={16} aria-hidden />
            Browse
          </Link>
          <Link className="button-ghost nav-link nav-secondary" href="/docs/agents">
            <BookOpen size={16} aria-hidden />
            Docs
          </Link>
          <Link className="button-secondary nav-cta" href="/onboard">
            <Plus size={16} aria-hidden />
            Onboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

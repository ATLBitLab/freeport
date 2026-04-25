import { Search } from "lucide-react";

import { LISTING_CATEGORIES } from "@/lib/constants";

export function SearchForm({
  q,
  category,
  tag,
}: {
  q?: string;
  category?: string;
  tag?: string;
}) {
  return (
    <form action="/listings" className="card grid gap-3 p-3 md:grid-cols-[1fr_220px_180px_auto]">
      <label className="relative">
        <span className="sr-only">Search listings</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          size={18}
          aria-hidden
        />
        <input className="field pl-10" name="q" defaultValue={q} placeholder="Search agents, APIs, workflows" />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <select className="field" name="category" defaultValue={category ?? ""}>
          <option value="">All categories</option>
          {LISTING_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Tag</span>
        <input className="field" name="tag" defaultValue={tag} placeholder="Tag" />
      </label>
      <button className="button-primary" type="submit">
        <Search size={16} aria-hidden />
        Search
      </button>
    </form>
  );
}

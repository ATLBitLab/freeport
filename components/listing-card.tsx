import Link from "next/link";
import { ArrowUpRight, Bot, Cable, Workflow } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/constants";
import type { ListingWithSeller } from "@/lib/types";

const icons = {
  agent_service: Bot,
  l402_api: Cable,
  l402_workflow: Workflow,
};

const iconTones = {
  agent_service: "category-mark-agent",
  l402_api: "category-mark-api",
  l402_workflow: "category-mark-workflow",
};

export function ListingCard({ listing }: { listing: ListingWithSeller }) {
  const Icon = icons[listing.category];

  return (
    <article className="h-full">
      <Link
        className="card listing-card flex h-full flex-col gap-5 p-5"
        href={`/listings/${listing.id}`}
        aria-label={`Open ${listing.title}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className={`category-mark ${iconTones[listing.category]}`}>
            <Icon size={20} aria-hidden />
          </div>
          <span className="label text-[var(--muted)]">{CATEGORY_LABELS[listing.category]}</span>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h2 className="text-xl font-black leading-tight">{listing.title}</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">{listing.summary}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="chip text-xs font-bold"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <div className="min-w-0">
            <p className="label text-[var(--muted)]">Seller</p>
            <p className="truncate text-sm font-bold">{listing.seller?.displayName ?? listing.seller?.pubkey}</p>
          </div>
          <span className="button-ghost listing-card-cue shrink-0 !px-3" aria-hidden="true">
            <ArrowUpRight size={16} aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}

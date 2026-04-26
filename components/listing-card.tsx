import Link from "next/link";
import { ArrowUpRight, Bot, Cable, Workflow } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/constants";
import { sellerAvatarInitial, sellerDisplayName } from "@/lib/seller-profile";
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
  const sellerName = sellerDisplayName(listing.seller);
  const pictureUrl = listing.seller?.profilePictureUrl;

  return (
    <article className="card flex h-full flex-col gap-5 p-5">
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
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel-strong)] bg-cover bg-center text-sm font-black text-[var(--accent-dark)]"
            style={pictureUrl ? { backgroundImage: `url("${pictureUrl}")` } : undefined}
            aria-hidden
          >
            {pictureUrl ? null : sellerAvatarInitial(listing.seller)}
          </div>
          <div className="min-w-0">
            <p className="label text-[var(--muted)]">Seller</p>
            <p className="truncate text-sm font-bold">{sellerName}</p>
          </div>
        </div>
        <Link className="button-ghost shrink-0 !px-3" href={`/listings/${listing.id}`} aria-label={`Open ${listing.title}`}>
          <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

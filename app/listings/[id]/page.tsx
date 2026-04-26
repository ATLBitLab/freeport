import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/constants";
import { getRepository } from "@/lib/repository";
import { sellerAvatarInitial, sellerDisplayName } from "@/lib/seller-profile";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getRepository().getListing(id);

  if (!listing || !listing.active || listing.moderationStatus !== "active") {
    notFound();
  }

  const sellerName = sellerDisplayName(listing.seller);
  const pictureUrl = listing.seller?.profilePictureUrl;
  const sellerProfileRows = [
    ["Website", listing.seller?.profileWebsite],
    ["NIP-05", listing.seller?.profileNip05],
    ["Lightning", listing.seller?.profileLud16],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <main className="container-shell flex-1 py-10">
      <div className="grid gap-8">
        <Link className="button-ghost justify-self-start" href="/listings">
          <ArrowLeft size={16} aria-hidden />
          Back to listings
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-6">
            <div className="page-header">
              <div className="flex flex-wrap gap-2">
                <span className="label page-kicker">
                  {CATEGORY_LABELS[listing.category]}
                </span>
                <span className="label page-kicker">
                  {listing.pricingModel}
                </span>
              </div>
              <h1 className="display-type max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{listing.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">{listing.summary}</p>
            </div>

            <div className="card grid gap-4 p-6">
              <p className="label text-[var(--muted)]">Description</p>
              <p className="whitespace-pre-wrap leading-8 text-[var(--foreground)]">{listing.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
                {JSON.stringify({ sample_input: listing.sampleInput }, null, 2)}
              </pre>
              <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
                {JSON.stringify({ sample_output: listing.sampleOutput }, null, 2)}
              </pre>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <div className="card grid gap-4 p-5">
              <div className="flex items-start gap-3">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel-strong)] bg-cover bg-center text-xl font-black text-[var(--accent-dark)]"
                  style={pictureUrl ? { backgroundImage: `url("${pictureUrl}")` } : undefined}
                  aria-hidden
                >
                  {pictureUrl ? null : sellerAvatarInitial(listing.seller)}
                </div>
                <div className="min-w-0">
                  <p className="label text-[var(--muted)]">Seller</p>
                  <p className="mt-1 break-words text-lg font-black">{sellerName}</p>
                  {listing.seller?.profileBot !== null && listing.seller?.profileBot !== undefined ? (
                    <span className="chip mt-2 inline-flex text-xs font-bold">
                      Bot: {listing.seller.profileBot ? "yes" : "no"}
                    </span>
                  ) : null}
                </div>
              </div>
              {listing.seller?.profileAbout ? (
                <p className="text-sm leading-6 text-[var(--muted)]">{listing.seller.profileAbout}</p>
              ) : null}
              {sellerProfileRows.length ? (
                <div className="grid gap-3 border-t border-[var(--line)] pt-4">
                  {sellerProfileRows.map(([label, value]) => (
                    <div key={label} className="grid gap-1">
                      <p className="label text-[var(--muted)]">{label}</p>
                      {label === "Website" ? (
                        <a
                          className="break-all text-sm font-bold underline"
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="break-all text-sm font-bold">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-1">
                <p className="label text-[var(--muted)]">Pubkey</p>
                <p className="break-all font-mono text-xs leading-5">{listing.seller?.pubkey}</p>
              </div>
            </div>

            <div className="card grid gap-4 p-5">
              <div>
                <p className="label text-[var(--muted)]">Invocation</p>
                <p className="mt-1 font-bold">{listing.invocationMethod}</p>
              </div>
              {listing.invocationUrl ? (
                <a className="button-primary" href={listing.invocationUrl} target="_blank" rel="noreferrer">
                  Open endpoint
                  <ExternalLink size={16} aria-hidden />
                </a>
              ) : null}
              <pre className="overflow-auto rounded-[var(--radius)] bg-[var(--panel-strong)] p-3 font-mono text-xs leading-5">
                {JSON.stringify(listing.contactInfo, null, 2)}
              </pre>
            </div>

            <div className="card grid gap-3 p-5">
              <p className="label text-[var(--muted)]">Signed event</p>
              <p className="break-all font-mono text-xs leading-5">{listing.eventId}</p>
              <Link className="button-ghost" href={`/api/events/${listing.eventId}`}>
                View event JSON
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

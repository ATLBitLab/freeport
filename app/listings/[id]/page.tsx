import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/constants";
import { getRepository } from "@/lib/repository";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getRepository().getListing(id);

  if (!listing || !listing.active || listing.moderationStatus !== "active") {
    notFound();
  }

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
              <div>
                <p className="label text-[var(--muted)]">Seller</p>
                <p className="mt-1 text-lg font-black">{listing.seller?.displayName ?? "Unknown seller"}</p>
              </div>
              <div className="grid gap-1">
                <p className="label text-[var(--muted)]">Pubkey</p>
                <p className="break-all font-mono text-xs leading-5">{listing.seller?.pubkey}</p>
              </div>
            </div>

            {listing.contactMethods.length ? (
              <div className="card grid gap-3 p-5">
                <p className="label text-[var(--muted)]">Contact methods</p>
                {listing.contactMethods.map((method, index) => (
                  <div key={`${method.type}-${method.value}-${index}`} className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip text-xs font-bold">{method.type}</span>
                      {method.preferred ? <span className="label text-[var(--accent-dark)]">Preferred</span> : null}
                    </div>
                    <p className="break-all font-mono text-xs leading-5">{method.value}</p>
                    {method.label ? <p className="text-sm text-[var(--muted)]">{method.label}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            {listing.paymentMethods.length ? (
              <div className="card grid gap-3 p-5">
                <p className="label text-[var(--muted)]">Payment methods</p>
                {listing.paymentMethods.map((method, index) => (
                  <div key={`${method.type}-${method.value}-${index}`} className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip text-xs font-bold">{method.type}</span>
                      {method.preferred ? <span className="label text-[var(--accent-dark)]">Preferred</span> : null}
                    </div>
                    <p className="break-all font-mono text-xs leading-5">{method.value}</p>
                    {method.label ? <p className="text-sm text-[var(--muted)]">{method.label}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

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

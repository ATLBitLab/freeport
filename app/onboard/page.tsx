import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeeCheckoutButton } from "@/components/fee-checkout-button";
import { ListingComposer } from "@/components/listing-composer";
import { OnboardingPrompt } from "@/components/onboarding-prompt";
import { LISTING_FEE_DISPLAY } from "@/lib/constants";

export default function OnboardPage() {
  return (
    <main className="container-shell flex-1 py-10">
      <div className="grid gap-10">
        <section className="grid gap-5 md:grid-cols-[1fr_360px]">
          <div className="page-header">
            <p className="label page-kicker">Seller onboarding</p>
            <h1 className="display-type max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Get your agent onto Freeport.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Sellers use their own keypair, pay a {LISTING_FEE_DISPLAY} listing fee, and publish a signed event over HTTP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button-ghost" href="/docs/agents">
                Read agent instructions
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link className="button-ghost" href="/docs/api">
                API reference
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="card grid content-start gap-4 p-5">
            <p className="label text-[var(--muted)]">Listing fee</p>
            <h2 className="text-2xl font-black">{LISTING_FEE_DISPLAY} per listing</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Production agents can use the L402 challenge returned by POST /api/listings. Humans can launch an MDK checkout here when credentials are configured.
            </p>
            <FeeCheckoutButton />
          </div>
        </section>

        <OnboardingPrompt />
        <ListingComposer />
      </div>
    </main>
  );
}

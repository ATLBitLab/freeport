"use client";

import Link from "next/link";
import { useCheckoutSuccess } from "@moneydevkit/nextjs";

export default function CheckoutSuccessPage() {
  const { isCheckoutPaidLoading, isCheckoutPaid } = useCheckoutSuccess();

  return (
    <main className="container-shell grid flex-1 place-items-center py-16">
      <section className="card grid max-w-xl gap-4 p-8 text-center">
        <p className="label text-[var(--muted)]">Checkout</p>
        <h1 className="text-4xl font-black">
          {isCheckoutPaidLoading || isCheckoutPaid === null
            ? "Verifying payment"
            : isCheckoutPaid
              ? "Payment confirmed"
              : "Payment not confirmed"}
        </h1>
        <p className="leading-7 text-[var(--muted)]">
          Listing creation still requires a signed event. Agent clients normally use the L402 challenge on POST /api/listings directly.
        </p>
        <Link className="button-primary justify-self-center" href="/onboard">
          Continue onboarding
        </Link>
      </section>
    </main>
  );
}

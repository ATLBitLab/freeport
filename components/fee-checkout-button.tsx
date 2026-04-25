"use client";

import { useCheckout } from "@moneydevkit/nextjs";
import { Zap } from "lucide-react";
import { useState } from "react";

import { LISTING_FEE_USD_CENTS } from "@/lib/constants";

export function FeeCheckoutButton() {
  const { createCheckout, isLoading } = useCheckout();
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    const result = await createCheckout({
      type: "AMOUNT",
      title: "Freeport listing fee",
      description: "Per-listing Lightning spam-resistance fee.",
      amount: LISTING_FEE_USD_CENTS,
      currency: "USD",
      successUrl: "/checkout/success",
      metadata: {
        product: "freeport_listing_fee",
      },
    });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    window.location.href = result.data.checkoutUrl;
  }

  return (
    <div className="grid gap-2">
      <button className="button-primary" type="button" disabled={isLoading} onClick={startCheckout}>
        <Zap size={16} aria-hidden />
        {isLoading ? "Creating invoice" : "Pay listing fee"}
      </button>
      {error ? <p className="text-sm font-semibold text-[var(--accent-dark)]">{error}</p> : null}
    </div>
  );
}

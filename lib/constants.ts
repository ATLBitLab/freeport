import type { ListingCategory, ListingPricingModel } from "@/lib/types";

export const FREEPORT_NAME = "Freeport";
export const LISTING_FEE_USD_CENTS = 50;
export const LISTING_FEE_DISPLAY = "$0.50";

export const EVENT_KINDS = {
  sellerProfile: 33000,
  listing: 33001,
  listingDeactivation: 33002,
} as const;

export const LISTING_CATEGORIES: Array<{
  id: ListingCategory;
  label: string;
  description: string;
}> = [
  {
    id: "agent_service",
    label: "Agent services",
    description: "Agents that can be contacted or invoked to perform work.",
  },
  {
    id: "l402_api",
    label: "L402 APIs",
    description: "HTTP APIs that unlock with a Lightning L402 credential.",
  },
  {
    id: "l402_workflow",
    label: "L402 workflows",
    description: "Paid agent workflows that accept inputs and return outputs.",
  },
];

export const PRICING_MODELS: ListingPricingModel[] = [
  "free_contact",
  "fixed_sats",
  "fixed_usd",
  "l402",
  "quote_required",
  "fixed",
  "donation",
  "amountless_offer",
];

export const CATEGORY_LABELS = Object.fromEntries(
  LISTING_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<ListingCategory, string>;

export const ONBOARDING_PROMPT = `You are onboarding to Freeport, a marketplace where agents buy and sell work.

1. Open /llms.txt and read the Freeport agent instructions.
2. Browse /api/listings and /api/categories to understand the marketplace.
3. If selling, generate a Nostr-style secp256k1 keypair and keep the private key local.
4. Prepare a signed listing event with category, title, summary, description, pricing metadata, and structured contact/payment methods. Agent-service listings should include contact_methods and payment_methods arrays.
5. Request the per-listing fee flow. In production, POST /api/listings without Authorization to receive an L402 invoice for $0.50 USD, pay it with a Lightning wallet, then retry with Authorization: L402 <macaroon>:<preimage>.
6. POST the signed event to /api/listings.
7. Use PATCH /api/listings/{id} for updates and POST /api/listings/{id}/deactivate when the listing should stop appearing.`;

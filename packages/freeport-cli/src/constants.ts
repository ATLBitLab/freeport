import type { ListingCategory, ListingPricingModel } from "./types.js";

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
];

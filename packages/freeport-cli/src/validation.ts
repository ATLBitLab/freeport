import { z } from "zod";

import { EVENT_KINDS, LISTING_CATEGORIES, PRICING_MODELS } from "./constants.js";
import type { ListingContent, NostrEvent } from "./types.js";

export const hex64 = z.string().regex(/^[0-9a-f]{64}$/);
export const hex128 = z.string().regex(/^[0-9a-f]{128}$/);
export const jsonObject = z.record(z.string(), z.unknown()).default({});

export const ListingCategorySchema = z.enum(
  LISTING_CATEGORIES.map((category) => category.id) as [
    "agent_service",
    "l402_api",
    "l402_workflow",
  ],
);

export const ListingPricingModelSchema = z.enum(
  PRICING_MODELS as [
    "free_contact",
    "fixed_sats",
    "fixed_usd",
    "l402",
    "quote_required",
  ],
);

export const InvocationMethodSchema = z.enum([
  "https",
  "l402",
  "nostr_dm",
  "email",
  "webhook",
  "manual_contact",
]);

export const ListingContentSchema = z
  .object({
    category: ListingCategorySchema,
    title: z.string().trim().min(4).max(120),
    summary: z.string().trim().min(12).max(220),
    description: z.string().trim().min(40).max(4000),
    tags: z
      .array(z.string().trim().min(1).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/))
      .max(16)
      .default([]),
    pricing_model: ListingPricingModelSchema.default("quote_required"),
    pricing_details: jsonObject,
    invocation_method: InvocationMethodSchema.default("manual_contact"),
    invocation_url: z
      .string()
      .trim()
      .url()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : null)),
    contact_info: jsonObject,
    sample_input: z.unknown().optional().nullable(),
    sample_output: z.unknown().optional().nullable(),
    required_capabilities: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
    expires_at: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, context) => {
    const contactKeys = ["url", "email", "nostr", "webhook", "lightning_address"];
    const hasContact = contactKeys.some((key) => Boolean(value.contact_info[key]));
    if (!value.invocation_url && !hasContact) {
      context.addIssue({
        code: "custom",
        message: "Listing requires invocation_url or contact_info with url, email, nostr, webhook, or lightning_address.",
        path: ["contact_info"],
      });
    }
  });

export const NostrEventSchema = z.object({
  id: hex64,
  pubkey: hex64,
  created_at: z.number().int().positive(),
  kind: z.number().int().positive(),
  tags: z.array(z.array(z.string())),
  content: z.string().min(2).max(20000),
  sig: hex128,
});

export const ListingEventSchema = NostrEventSchema.refine(
  (event) =>
    event.kind === EVENT_KINDS.listing ||
    event.kind === EVENT_KINDS.listingDeactivation ||
    event.kind === EVENT_KINDS.sellerProfile,
  {
    message: "Unsupported Freeport event kind.",
    path: ["kind"],
  },
);

export function parseListingContent(raw: string | unknown): ListingContent {
  let parsed: unknown;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Event content must be valid JSON.");
    }
  } else {
    parsed = raw;
  }

  return ListingContentSchema.parse(parsed) as ListingContent;
}

export function parseSignedEvent(raw: unknown): NostrEvent {
  const candidate =
    raw && typeof raw === "object" && "event" in raw
      ? (raw as { event?: unknown }).event
      : raw;
  return NostrEventSchema.parse(candidate) as NostrEvent;
}

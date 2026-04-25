import { z } from "zod";

import { EVENT_KINDS, LISTING_CATEGORIES, PRICING_MODELS } from "@/lib/constants";

const hex64 = z.string().regex(/^[0-9a-f]{64}$/);
const hex128 = z.string().regex(/^[0-9a-f]{128}$/);
const jsonObject = z.record(z.string(), z.unknown()).default({});

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

export const CreateListingRequestSchema = z.object({
  event: ListingEventSchema,
  listing_fee_payment_id: z.string().uuid().optional(),
});

export const SellerRegisterSchema = z.object({
  pubkey: hex64,
  display_name: z.string().trim().min(2).max(80).optional(),
  contact_method_type: z.string().trim().min(2).max(40).optional(),
  contact_method_value: z.string().trim().min(2).max(240).optional(),
  wallet_type: z.string().trim().min(2).max(80).default("moneydevkit_agent_wallet"),
  wallet_metadata: jsonObject,
});

export const SigningTemplateRequestSchema = z.object({
  pubkey: hex64,
  kind: z.number().int().positive().default(EVENT_KINDS.listing),
  content: ListingContentSchema,
  tags: z.array(z.array(z.string())).optional(),
});

export const ListingFeeRequestSchema = z.object({
  pubkey: hex64.optional(),
  seller_id: z.string().uuid().optional(),
  listing_title: z.string().trim().max(120).optional(),
});

export const ListingFeeConfirmSchema = z.object({
  payment_id: z.string().uuid(),
  proof_payload: jsonObject.optional(),
});

export function parseListingContent(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Event content must be valid JSON.");
  }
  return ListingContentSchema.parse(parsed);
}

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
    "fixed",
    "donation",
    "amountless_offer",
  ],
);

export const ListingPricingModelDetailsSchema = z.object({
  type: z.enum(["fixed", "quote_required", "donation", "amountless_offer", "l402"]),
  currency: z.string().trim().min(2).max(16).optional(),
  amount: z.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const ListingPricingModelInputSchema = z.union([
  ListingPricingModelSchema,
  ListingPricingModelDetailsSchema,
]);

export const InvocationMethodSchema = z.enum([
  "https",
  "l402",
  "nostr_dm",
  "email",
  "webhook",
  "manual_contact",
]);

export const ContactMethodSchema = z
  .object({
    type: z.enum(["email", "nostr", "http", "telegram", "discord", "other"]),
    value: z.string().trim().min(2).max(500),
    label: z.string().trim().min(1).max(80).optional(),
    preferred: z.boolean().optional(),
  })
  .superRefine((method, context) => {
    if (method.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(method.value)) {
      context.addIssue({
        code: "custom",
        message: "Email contact method must contain a valid email address.",
        path: ["value"],
      });
    }
    if (method.type === "http") {
      const parsed = z.string().url().safeParse(method.value);
      if (!parsed.success) {
        context.addIssue({
          code: "custom",
          message: "HTTP contact method must contain a valid URL.",
          path: ["value"],
        });
      }
    }
  });

export const PaymentMethodSchema = z.object({
  type: z.enum(["bolt12_offer", "lightning_address", "lnurl_pay", "l402"]),
  value: z.string().trim().min(2).max(1200),
  label: z.string().trim().min(1).max(80).optional(),
  preferred: z.boolean().optional(),
});

export const DeliveryMethodSchema = z.enum(["async_contact", "email", "api", "scheduled_call", "manual"]);

export const AvailabilitySchema = z.object({
  status: z.enum(["open", "limited", "closed"]),
});

export const ServiceAreaSchema = z.object({
  mode: z.enum(["remote", "local", "hybrid"]),
  languages: z.array(z.string().trim().min(2).max(16)).max(20).optional(),
});

const sellerPubkey = z.string().trim().regex(/^(npub1[023456789acdefghjklmnpqrstuvwxyz]+|[0-9a-f]{64})$/);

export const AgentServiceSellerSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  pubkey: sellerPubkey,
});

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
    seller: AgentServiceSellerSchema.optional(),
    contact_methods: z.array(ContactMethodSchema).max(8).default([]),
    payment_methods: z.array(PaymentMethodSchema).max(8).default([]),
    pricing_model: ListingPricingModelInputSchema.default("quote_required"),
    pricing_details: jsonObject.optional().default({}),
    delivery_method: DeliveryMethodSchema.optional(),
    turnaround: jsonObject.optional().nullable(),
    service_area: ServiceAreaSchema.optional().nullable(),
    capabilities: z.array(z.string().trim().min(1).max(80)).max(32).default([]),
    requirements: z.array(z.string().trim().min(1).max(180)).max(32).default([]),
    availability: AvailabilitySchema.optional().nullable(),
    metadata: jsonObject.optional().default({}),
    invocation_method: InvocationMethodSchema.default("manual_contact"),
    invocation_url: z
      .string()
      .trim()
      .url()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : null)),
    contact_info: jsonObject.optional().default({}),
    sample_input: z.unknown().optional().nullable(),
    sample_output: z.unknown().optional().nullable(),
    required_capabilities: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
    expires_at: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.category === "agent_service") {
      if (!value.seller) {
        context.addIssue({
          code: "custom",
          message: "agent_service listings require seller.display_name and seller.pubkey.",
          path: ["seller"],
        });
      }
      if (value.contact_methods.length === 0) {
        context.addIssue({
          code: "custom",
          message: "agent_service listings require at least one structured contact method.",
          path: ["contact_methods"],
        });
      }
      if (value.payment_methods.length === 0) {
        context.addIssue({
          code: "custom",
          message: "agent_service listings require at least one structured payment method.",
          path: ["payment_methods"],
        });
      }
      if (typeof value.pricing_model === "string") {
        context.addIssue({
          code: "custom",
          message: "agent_service listings require pricing_model as an object with at least a type field.",
          path: ["pricing_model"],
        });
      }
      if (!value.delivery_method) {
        context.addIssue({
          code: "custom",
          message: "agent_service listings require delivery_method.",
          path: ["delivery_method"],
        });
      }
    }

    const contactKeys = ["url", "email", "nostr", "webhook", "lightning_address"];
    const hasContact = contactKeys.some((key) => Boolean(value.contact_info[key]));
    const hasStructuredContact = value.contact_methods.length > 0;
    if (!value.invocation_url && !hasContact && !hasStructuredContact) {
      context.addIssue({
        code: "custom",
        message:
          "Listing requires invocation_url, structured contact_methods, or contact_info with url, email, nostr, webhook, or lightning_address.",
        path: ["contact_methods"],
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

export function pricingModelType(pricingModel: string | { type: string }) {
  return typeof pricingModel === "string" ? pricingModel : pricingModel.type;
}

export function assertListingSellerMatchesSigner(
  content: { category: string; seller?: { pubkey: string } },
  eventPubkey: string,
) {
  if (content.category !== "agent_service" || !content.seller) return;
  if (/^[0-9a-f]{64}$/.test(content.seller.pubkey) && content.seller.pubkey !== eventPubkey) {
    throw new Error("agent_service seller.pubkey must match the signing event pubkey when provided as hex.");
  }
}

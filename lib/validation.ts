import { z } from "zod";
import {
  hex64,
  InvocationMethodSchema,
  jsonObject,
  ListingCategorySchema,
  ListingContentSchema,
  ListingEventSchema,
  ListingPricingModelSchema,
  NostrEventSchema,
  parseListingContent,
} from "@atlbitlab/freeport-cli/validation";

import { EVENT_KINDS } from "@/lib/constants";

export {
  ListingCategorySchema,
  ListingContentSchema,
  ListingEventSchema,
  ListingPricingModelSchema,
  InvocationMethodSchema,
  NostrEventSchema,
  parseListingContent,
};

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

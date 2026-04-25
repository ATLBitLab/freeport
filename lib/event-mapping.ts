import { randomUUID } from "node:crypto";

import { EVENT_KINDS } from "@/lib/constants";
import { canonicalEventJson } from "@/lib/nostr";
import { parseListingContent } from "@/lib/validation";
import type {
  JsonObject,
  JsonValue,
  ListingEventRecord,
  ListingWithSeller,
  NostrEvent,
  Seller,
} from "@/lib/types";

export function uuidFromEventId(eventId: string) {
  const hex = eventId.padEnd(32, "0").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  const compact = hex.join("");
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`;
}

export function listingFromEvent(event: NostrEvent, seller: Seller): ListingWithSeller {
  const content = parseListingContent(event.content);
  const now = new Date(event.created_at * 1000).toISOString();
  return {
    id: uuidFromEventId(event.id),
    sellerId: seller.id,
    eventId: event.id,
    kind: event.kind,
    category: content.category,
    title: content.title,
    summary: content.summary,
    description: content.description,
    tags: content.tags,
    pricingModel: content.pricing_model,
    pricingDetails: content.pricing_details as JsonObject,
    invocationMethod: content.invocation_method,
    invocationUrl: content.invocation_url ?? null,
    contactInfo: content.contact_info as JsonObject,
    sampleInput: (content.sample_input as JsonValue | undefined) ?? null,
    sampleOutput: (content.sample_output as JsonValue | undefined) ?? null,
    requiredCapabilities: content.required_capabilities,
    moderationStatus: "active",
    hiddenReason: null,
    active: event.kind === EVENT_KINDS.listing,
    createdAt: now,
    updatedAt: now,
    expiresAt: content.expires_at ?? null,
    seller,
  };
}

export function eventRecordFromEvent(event: NostrEvent, listingId: string | null) {
  const insertedAt = new Date().toISOString();
  const record: ListingEventRecord = {
    id: randomUUID(),
    listingId,
    eventId: event.id,
    pubkey: event.pubkey,
    kind: event.kind,
    createdAtUnix: event.created_at,
    sig: event.sig,
    content: event.content,
    tags: event.tags,
    canonicalJson: canonicalEventJson(event),
    validSignature: true,
    supersededByEventId: null,
    insertedAt,
  };
  return record;
}

export function listingToPublicJson(listing: ListingWithSeller) {
  return {
    id: listing.id,
    seller_id: listing.sellerId,
    seller: listing.seller
      ? {
          id: listing.seller.id,
          pubkey: listing.seller.pubkey,
          display_name: listing.seller.displayName,
          contact_method_type: listing.seller.contactMethodType,
          contact_method_value: listing.seller.contactMethodValue,
          wallet_type: listing.seller.walletType,
          status: listing.seller.status,
        }
      : null,
    event_id: listing.eventId,
    kind: listing.kind,
    category: listing.category,
    title: listing.title,
    summary: listing.summary,
    description: listing.description,
    tags: listing.tags,
    pricing_model: listing.pricingModel,
    pricing_details: listing.pricingDetails,
    invocation_method: listing.invocationMethod,
    invocation_url: listing.invocationUrl,
    contact_info: listing.contactInfo,
    sample_input: listing.sampleInput,
    sample_output: listing.sampleOutput,
    required_capabilities: listing.requiredCapabilities,
    moderation_status: listing.moderationStatus,
    active: listing.active,
    created_at: listing.createdAt,
    updated_at: listing.updatedAt,
    expires_at: listing.expiresAt,
  };
}

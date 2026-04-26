import { randomUUID } from "node:crypto";

import { EVENT_KINDS } from "@/lib/constants";
import { canonicalEventJson } from "@/lib/nostr";
import { parseListingContent, pricingModelType } from "@/lib/validation";
import type {
  ContactMethod,
  DeliveryMethod,
  JsonObject,
  JsonValue,
  ListingEventRecord,
  ListingPricingModel,
  PaymentMethod,
  ListingWithSeller,
  NostrEvent,
  Seller,
} from "@/lib/types";

export function sellerToPublicJson(seller: Seller, options: { includeTimestamps?: boolean } = {}) {
  return {
    id: seller.id,
    pubkey: seller.pubkey,
    display_name: seller.displayName,
    contact_method_type: seller.contactMethodType,
    contact_method_value: seller.contactMethodValue,
    wallet_type: seller.walletType,
    status: seller.status,
    profile_name: seller.profileName,
    profile_display_name: seller.profileDisplayName,
    profile_about: seller.profileAbout,
    profile_picture_url: seller.profilePictureUrl,
    profile_website: seller.profileWebsite,
    profile_nip05: seller.profileNip05,
    profile_lud16: seller.profileLud16,
    profile_bot: seller.profileBot,
    profile_metadata: seller.profileMetadata,
    profile_event_id: seller.profileEventId,
    profile_event_created_at: seller.profileEventCreatedAt,
    ...(options.includeTimestamps
      ? {
          created_at: seller.createdAt,
          updated_at: seller.updatedAt,
        }
      : {}),
  };
}

export function uuidFromEventId(eventId: string) {
  const hex = eventId.padEnd(32, "0").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  const compact = hex.join("");
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`;
}

function jsonObjectOrNull(value: JsonObject | null | undefined) {
  return value && Object.keys(value).length ? value : null;
}

function contactMethodsFromLegacy(contactInfo: JsonObject): ContactMethod[] {
  const methods: ContactMethod[] = [];
  const mappings: Array<[ContactMethod["type"], string]> = [
    ["email", "email"],
    ["nostr", "nostr"],
    ["http", "url"],
    ["http", "webhook"],
  ];

  for (const [type, key] of mappings) {
    const value = contactInfo[key];
    if (typeof value === "string" && value.trim()) {
      methods.push({
        type,
        value,
        label: key === "webhook" ? "Webhook" : undefined,
        preferred: methods.length === 0,
      });
    }
  }

  return methods;
}

function paymentMethodsFromPricingDetails(pricingDetails: JsonObject): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  const mappings: Array<[PaymentMethod["type"], string]> = [
    ["bolt12_offer", "bolt12_offer"],
    ["lightning_address", "lightning_address"],
    ["lnurl_pay", "lnurl_pay"],
  ];

  for (const [type, key] of mappings) {
    const value = pricingDetails[key];
    if (typeof value === "string" && value.trim()) {
      methods.push({ type, value, preferred: methods.length === 0 });
    }
  }

  return methods;
}

function pricingDetailsFromContent(content: ReturnType<typeof parseListingContent>) {
  if (typeof content.pricing_model === "string") return content.pricing_details as JsonObject;
  const details: Record<string, unknown> = { ...content.pricing_model };
  delete details.type;
  return {
    ...details,
    ...(content.pricing_details as JsonObject),
  } as JsonObject;
}

function invocationMethodFromContent(content: ReturnType<typeof parseListingContent>) {
  if (content.invocation_method) return content.invocation_method;
  if (content.delivery_method === "email") return "email";
  if (content.delivery_method === "api") return "https";
  return "manual_contact";
}

export function listingFromEvent(event: NostrEvent, seller: Seller): ListingWithSeller {
  const content = parseListingContent(event.content);
  const now = new Date(event.created_at * 1000).toISOString();
  const pricingDetails = pricingDetailsFromContent(content);
  const contactInfo = (content.contact_info as JsonObject | undefined) ?? {};
  const contactMethods = content.contact_methods.length
    ? (content.contact_methods as ContactMethod[])
    : contactMethodsFromLegacy(contactInfo);
  const paymentMethods = content.payment_methods.length
    ? (content.payment_methods as PaymentMethod[])
    : paymentMethodsFromPricingDetails(pricingDetails);

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
    pricingModel: pricingModelType(content.pricing_model) as ListingPricingModel,
    pricingDetails,
    invocationMethod: invocationMethodFromContent(content),
    invocationUrl: content.invocation_url ?? null,
    contactInfo,
    contactMethods,
    paymentMethods,
    deliveryMethod: (content.delivery_method as DeliveryMethod | undefined) ?? null,
    turnaround: jsonObjectOrNull(content.turnaround as JsonObject | null | undefined),
    serviceArea: jsonObjectOrNull(content.service_area as JsonObject | null | undefined),
    capabilities: content.capabilities.length ? content.capabilities : content.required_capabilities,
    requirements: content.requirements,
    availability: jsonObjectOrNull(content.availability as JsonObject | null | undefined),
    metadata: (content.metadata as JsonObject | undefined) ?? {},
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
    seller: listing.seller ? sellerToPublicJson(listing.seller) : null,
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
    contact_methods: listing.contactMethods,
    payment_methods: listing.paymentMethods,
    delivery_method: listing.deliveryMethod,
    turnaround: listing.turnaround,
    service_area: listing.serviceArea,
    capabilities: listing.capabilities,
    requirements: listing.requirements,
    availability: listing.availability,
    metadata: listing.metadata,
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

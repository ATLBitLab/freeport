import type {
  ContactMethod,
  DeliveryMethod,
  JsonObject,
  Listing,
  ListingEventRecord,
  ListingFeePayment,
  ListingWithSeller,
  PaymentMethod,
  Seller,
} from "@/lib/types";

type DbRow = Record<string, unknown>;

export function sellerFromRow(row: DbRow): Seller {
  return {
    id: row.id as string,
    pubkey: row.pubkey as string,
    displayName: (row.display_name as string | null) ?? null,
    contactMethodType: (row.contact_method_type as string | null) ?? null,
    contactMethodValue: (row.contact_method_value as string | null) ?? null,
    walletType: (row.wallet_type as string | null) ?? null,
    walletMetadata: (row.wallet_metadata as JsonObject | null) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as Seller["status"],
  };
}

export function sellerToRow(seller: Partial<Seller> & { pubkey: string }) {
  return {
    pubkey: seller.pubkey,
    display_name: seller.displayName ?? null,
    contact_method_type: seller.contactMethodType ?? null,
    contact_method_value: seller.contactMethodValue ?? null,
    wallet_type: seller.walletType ?? "moneydevkit_agent_wallet",
    wallet_metadata: seller.walletMetadata ?? {},
    status: seller.status ?? "active",
  };
}

export function listingFromRow(row: DbRow, seller?: Seller | null): ListingWithSeller {
  const base: Listing = {
    id: row.id as string,
    sellerId: row.seller_id as string,
    eventId: row.event_id as string,
    kind: row.kind as number,
    category: row.category as Listing["category"],
    title: row.title as string,
    summary: row.summary as string,
    description: row.description as string,
    tags: (row.tags as string[] | null) ?? [],
    pricingModel: row.pricing_model as Listing["pricingModel"],
    pricingDetails: (row.pricing_details as JsonObject | null) ?? {},
    invocationMethod: row.invocation_method as Listing["invocationMethod"],
    invocationUrl: (row.invocation_url as string | null) ?? null,
    contactInfo: (row.contact_info as JsonObject | null) ?? {},
    contactMethods: (row.contact_methods as ContactMethod[] | null) ?? [],
    paymentMethods: (row.payment_methods as PaymentMethod[] | null) ?? [],
    deliveryMethod: (row.delivery_method as DeliveryMethod | null) ?? null,
    turnaround: (row.turnaround as JsonObject | null) ?? null,
    serviceArea: (row.service_area as JsonObject | null) ?? null,
    capabilities: (row.capabilities as string[] | null) ?? [],
    requirements: (row.requirements as string[] | null) ?? [],
    availability: (row.availability as JsonObject | null) ?? null,
    metadata: (row.metadata as JsonObject | null) ?? {},
    sampleInput: (row.sample_input as Listing["sampleInput"] | null) ?? null,
    sampleOutput: (row.sample_output as Listing["sampleOutput"] | null) ?? null,
    requiredCapabilities: (row.required_capabilities as string[] | null) ?? [],
    moderationStatus: row.moderation_status as Listing["moderationStatus"],
    hiddenReason: (row.hidden_reason as string | null) ?? null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    expiresAt: (row.expires_at as string | null) ?? null,
  };
  const sellerRow = row.sellers;
  return {
    ...base,
    seller:
      seller ??
      (sellerRow
        ? sellerFromRow((Array.isArray(sellerRow) ? sellerRow[0] : sellerRow) as DbRow)
        : null),
  };
}

export function listingToRow(listing: Listing) {
  return {
    id: listing.id,
    seller_id: listing.sellerId,
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
    hidden_reason: listing.hiddenReason,
    active: listing.active,
    created_at: listing.createdAt,
    updated_at: listing.updatedAt,
    expires_at: listing.expiresAt,
  };
}

export function eventRecordFromRow(row: DbRow): ListingEventRecord {
  return {
    id: row.id as string,
    listingId: (row.listing_id as string | null) ?? null,
    eventId: row.event_id as string,
    pubkey: row.pubkey as string,
    kind: row.kind as number,
    createdAtUnix: row.created_at_unix as number,
    sig: row.sig as string,
    content: row.content as string,
    tags: (row.tags as string[][] | null) ?? [],
    canonicalJson: row.canonical_json as string,
    validSignature: row.valid_signature as boolean,
    supersededByEventId: (row.superseded_by_event_id as string | null) ?? null,
    insertedAt: row.inserted_at as string,
  };
}

export function eventRecordToRow(record: ListingEventRecord) {
  return {
    id: record.id,
    listing_id: record.listingId,
    event_id: record.eventId,
    pubkey: record.pubkey,
    kind: record.kind,
    created_at_unix: record.createdAtUnix,
    sig: record.sig,
    content: record.content,
    tags: record.tags,
    canonical_json: record.canonicalJson,
    valid_signature: record.validSignature,
    superseded_by_event_id: record.supersededByEventId,
    inserted_at: record.insertedAt,
  };
}

export function paymentFromRow(row: DbRow): ListingFeePayment {
  return {
    id: row.id as string,
    sellerId: (row.seller_id as string | null) ?? null,
    listingId: (row.listing_id as string | null) ?? null,
    invoiceId: (row.invoice_id as string | null) ?? null,
    paymentStatus: row.payment_status as ListingFeePayment["paymentStatus"],
    amountSats: (row.amount_sats as number | null) ?? null,
    amountUsdCents: row.amount_usd_cents as number,
    paidAt: (row.paid_at as string | null) ?? null,
    proofPayload: (row.proof_payload as JsonObject | null) ?? {},
    createdAt: row.created_at as string,
  };
}

export function paymentToRow(payment: ListingFeePayment) {
  return {
    id: payment.id,
    seller_id: payment.sellerId,
    listing_id: payment.listingId,
    invoice_id: payment.invoiceId,
    payment_status: payment.paymentStatus,
    amount_sats: payment.amountSats,
    amount_usd_cents: payment.amountUsdCents,
    paid_at: payment.paidAt,
    proof_payload: payment.proofPayload,
    created_at: payment.createdAt,
  };
}

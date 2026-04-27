import { randomUUID } from "node:crypto";

import { LISTING_FEE_USD_CENTS } from "@/lib/constants";
import { buildDemoData } from "@/lib/demo-data";
import {
  eventRecordFromRow,
  eventRecordToRow,
  listingFromRow,
  listingToRow,
  paymentFromRow,
  paymentToRow,
  sellerFromRow,
  sellerToRow,
} from "@/lib/db-mappers";
import { eventRecordFromEvent, listingFromEvent } from "@/lib/event-mapping";
import { hasSupabaseConfig } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase";
import type {
  JsonObject,
  ListingEventRecord,
  ListingFeePayment,
  ListingFilters,
  ListingWithSeller,
  NostrEvent,
  Seller,
} from "@/lib/types";

type Store = {
  sellers: Seller[];
  listings: ListingWithSeller[];
  events: ListingEventRecord[];
  payments: ListingFeePayment[];
};

const globalStore = globalThis as typeof globalThis & { __freeportStore?: Store };

function getMemoryStore(): Store {
  if (!globalStore.__freeportStore) {
    const demo = buildDemoData();
    globalStore.__freeportStore = {
      sellers: demo.sellers,
      listings: demo.listings,
      events: demo.events.map((event) => eventRecordFromEvent(event, event.id)),
      payments: [],
    };
  }
  return globalStore.__freeportStore;
}

function matchesListing(listing: ListingWithSeller, filters: ListingFilters) {
  if (filters.category && listing.category !== filters.category) return false;
  if (filters.sellerPubkey && listing.seller?.pubkey !== filters.sellerPubkey) return false;
  if (filters.tag && !listing.tags.includes(filters.tag)) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [
      listing.title,
      listing.summary,
      listing.description,
      listing.category,
      ...listing.tags,
      ...listing.capabilities,
      ...listing.requirements,
      ...listing.contactMethods.map((method) => `${method.type} ${method.label ?? ""} ${method.value}`),
      ...listing.paymentMethods.map((method) => `${method.type} ${method.label ?? ""}`),
      listing.seller?.displayName ?? "",
      listing.seller?.pubkey ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }
  return true;
}

class MemoryRepository {
  private store = getMemoryStore();

  async listListings(filters: ListingFilters = {}) {
    return this.store.listings
      .filter((listing) => listing.active && listing.moderationStatus === "active")
      .filter((listing) => matchesListing(listing, filters))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, filters.limit ?? 24);
  }

  async getListing(id: string) {
    return this.store.listings.find((listing) => listing.id === id || listing.eventId === id) ?? null;
  }

  async getSellerByPubkey(pubkey: string) {
    return this.store.sellers.find((seller) => seller.pubkey === pubkey) ?? null;
  }

  async upsertSeller(input: {
    pubkey: string;
    displayName?: string | null;
    contactMethodType?: string | null;
    contactMethodValue?: string | null;
    walletType?: string | null;
    walletMetadata?: Record<string, unknown>;
  }) {
    const existing = await this.getSellerByPubkey(input.pubkey);
    const now = new Date().toISOString();
    if (existing) {
      existing.displayName = input.displayName ?? existing.displayName;
      existing.contactMethodType = input.contactMethodType ?? existing.contactMethodType;
      existing.contactMethodValue = input.contactMethodValue ?? existing.contactMethodValue;
      existing.walletType = input.walletType ?? existing.walletType;
      existing.walletMetadata = (input.walletMetadata as JsonObject | undefined) ?? existing.walletMetadata;
      existing.updatedAt = now;
      return existing;
    }
    const seller: Seller = {
      id: randomUUID(),
      pubkey: input.pubkey,
      displayName: input.displayName ?? null,
      contactMethodType: input.contactMethodType ?? null,
      contactMethodValue: input.contactMethodValue ?? null,
      walletType: input.walletType ?? "moneydevkit_agent_wallet",
      walletMetadata: (input.walletMetadata as JsonObject | undefined) ?? {},
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
    this.store.sellers.push(seller);
    return seller;
  }

  async createListingFromEvent(event: NostrEvent) {
    const seller = await this.upsertSeller({ pubkey: event.pubkey });
    const listing = listingFromEvent(event, seller);
    if (!this.store.events.some((existing) => existing.eventId === event.id)) {
      this.store.events.push(eventRecordFromEvent(event, listing.id));
    }
    this.store.listings = this.store.listings.filter((existing) => existing.id !== listing.id);
    this.store.listings.push(listing);
    return listing;
  }

  async updateListing(id: string, event: NostrEvent) {
    const listing = await this.createListingFromEvent(event);
    const now = new Date().toISOString();
    const existingIndex = this.store.listings.findIndex((item) => item.id === id || item.eventId === id);
    if (existingIndex >= 0) {
      const existing = this.store.listings[existingIndex];
      listing.id = existing.id;
      listing.createdAt = existing.createdAt;
      listing.updatedAt = now;
      this.store.listings[existingIndex] = listing;
    }
    return listing;
  }

  async deactivateListing(id: string, event?: NostrEvent) {
    const listing = await this.getListing(id);
    if (!listing) return null;
    listing.active = false;
    listing.updatedAt = new Date().toISOString();
    if (event) this.store.events.push(eventRecordFromEvent(event, listing.id));
    return listing;
  }

  async getEvent(eventId: string) {
    return this.store.events.find((event) => event.eventId === eventId) ?? null;
  }

  async createPayment(input: {
    sellerId?: string | null;
    invoiceId?: string | null;
    paymentStatus?: ListingFeePayment["paymentStatus"];
    amountSats?: number | null;
    proofPayload?: Record<string, unknown>;
  }) {
    const now = new Date().toISOString();
    const payment: ListingFeePayment = {
      id: randomUUID(),
      sellerId: input.sellerId ?? null,
      listingId: null,
      invoiceId: input.invoiceId ?? null,
      paymentStatus: input.paymentStatus ?? "requested",
      amountSats: input.amountSats ?? null,
      amountUsdCents: LISTING_FEE_USD_CENTS,
      paidAt: input.paymentStatus === "paid" ? now : null,
      proofPayload: (input.proofPayload as JsonObject | undefined) ?? {},
      createdAt: now,
    };
    this.store.payments.push(payment);
    return payment;
  }

  async markPaymentPaid(id: string, proofPayload: Record<string, unknown>) {
    const payment = this.store.payments.find((item) => item.id === id);
    if (!payment) return null;
    payment.paymentStatus = "paid";
    payment.proofPayload = proofPayload as JsonObject;
    payment.paidAt = new Date().toISOString();
    return payment;
  }

  async consumePayment(id: string, listingId: string) {
    const payment = this.store.payments.find((item) => item.id === id);
    if (!payment || payment.paymentStatus !== "paid") return null;
    payment.paymentStatus = "consumed";
    payment.listingId = listingId;
    return payment;
  }

  async getPayment(id: string) {
    return this.store.payments.find((payment) => payment.id === id) ?? null;
  }
}

class SupabaseRepository {
  private client = createServiceClient();

  private requireClient() {
    if (!this.client) throw new Error("Supabase is not configured.");
    return this.client;
  }

  async listListings(filters: ListingFilters = {}) {
    const client = this.requireClient();
    let query = client
      .from("listings")
      .select("*, sellers(*)")
      .eq("active", true)
      .eq("moderation_status", "active")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 24);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.tag) query = query.contains("tags", [filters.tag]);
    if (filters.q) {
      const term = `%${filters.q}%`;
      query = query.or(`title.ilike.${term},summary.ilike.${term},description.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    let listings = (data ?? []).map((row) => listingFromRow(row));

    if (filters.sellerPubkey) {
      listings = listings.filter((listing) => listing.seller?.pubkey === filters.sellerPubkey);
    }

    return listings;
  }

  async getListing(id: string) {
    const client = this.requireClient();
    const { data, error } = await client
      .from("listings")
      .select("*, sellers(*)")
      .or(`id.eq.${id},event_id.eq.${id}`)
      .maybeSingle();
    if (error) throw error;
    return data ? listingFromRow(data) : null;
  }

  async getSellerByPubkey(pubkey: string) {
    const client = this.requireClient();
    const { data, error } = await client.from("sellers").select("*").eq("pubkey", pubkey).maybeSingle();
    if (error) throw error;
    return data ? sellerFromRow(data) : null;
  }

  async upsertSeller(input: {
    pubkey: string;
    displayName?: string | null;
    contactMethodType?: string | null;
    contactMethodValue?: string | null;
    walletType?: string | null;
    walletMetadata?: Record<string, unknown>;
  }) {
    const client = this.requireClient();
    const { data, error } = await client
      .from("sellers")
      .upsert(
        sellerToRow({
          pubkey: input.pubkey,
          displayName: input.displayName,
          contactMethodType: input.contactMethodType,
          contactMethodValue: input.contactMethodValue,
          walletType: input.walletType,
          walletMetadata: input.walletMetadata as JsonObject | undefined,
        }),
        { onConflict: "pubkey" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return sellerFromRow(data);
  }

  async createListingFromEvent(event: NostrEvent) {
    const client = this.requireClient();
    const seller = await this.upsertSeller({ pubkey: event.pubkey });
    const listing = listingFromEvent(event, seller);
    const eventRecord = eventRecordFromEvent(event, listing.id);

    const { error: listingError } = await client.from("listings").upsert(listingToRow(listing), {
      onConflict: "id",
    });
    if (listingError) throw listingError;

    const { error: eventError } = await client
      .from("listing_events")
      .upsert(eventRecordToRow(eventRecord), { onConflict: "event_id", ignoreDuplicates: true });
    if (eventError) throw eventError;

    return listing;
  }

  async updateListing(id: string, event: NostrEvent) {
    const existing = await this.getListing(id);
    if (!existing) return null;
    const seller = await this.upsertSeller({ pubkey: event.pubkey });
    const next = listingFromEvent(event, seller);
    next.id = existing.id;
    next.createdAt = existing.createdAt;
    next.updatedAt = new Date().toISOString();

    const client = this.requireClient();
    const { error: listingError } = await client.from("listings").upsert(listingToRow(next), {
      onConflict: "id",
    });
    if (listingError) throw listingError;
    const { error: eventError } = await client
      .from("listing_events")
      .insert(eventRecordToRow(eventRecordFromEvent(event, next.id)));
    if (eventError) throw eventError;
    return next;
  }

  async deactivateListing(id: string, event?: NostrEvent) {
    const existing = await this.getListing(id);
    if (!existing) return null;
    const client = this.requireClient();
    const { data, error } = await client
      .from("listings")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*, sellers(*)")
      .single();
    if (error) throw error;
    if (event) {
      await client.from("listing_events").insert(eventRecordToRow(eventRecordFromEvent(event, existing.id)));
    }
    return listingFromRow(data);
  }

  async getEvent(eventId: string) {
    const client = this.requireClient();
    const { data, error } = await client
      .from("listing_events")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data ? eventRecordFromRow(data) : null;
  }

  async createPayment(input: {
    sellerId?: string | null;
    invoiceId?: string | null;
    paymentStatus?: ListingFeePayment["paymentStatus"];
    amountSats?: number | null;
    proofPayload?: Record<string, unknown>;
  }) {
    const client = this.requireClient();
    const payment: ListingFeePayment = {
      id: randomUUID(),
      sellerId: input.sellerId ?? null,
      listingId: null,
      invoiceId: input.invoiceId ?? null,
      paymentStatus: input.paymentStatus ?? "requested",
      amountSats: input.amountSats ?? null,
      amountUsdCents: LISTING_FEE_USD_CENTS,
      paidAt: input.paymentStatus === "paid" ? new Date().toISOString() : null,
      proofPayload: (input.proofPayload as JsonObject | undefined) ?? {},
      createdAt: new Date().toISOString(),
    };
    const { data, error } = await client
      .from("listing_fee_payments")
      .insert(paymentToRow(payment))
      .select("*")
      .single();
    if (error) throw error;
    return paymentFromRow(data);
  }

  async markPaymentPaid(id: string, proofPayload: Record<string, unknown>) {
    const client = this.requireClient();
    const { data, error } = await client
      .from("listing_fee_payments")
      .update({
        payment_status: "paid",
        proof_payload: proofPayload,
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? paymentFromRow(data) : null;
  }

  async consumePayment(id: string, listingId: string) {
    const payment = await this.getPayment(id);
    if (!payment || payment.paymentStatus !== "paid") return null;
    const client = this.requireClient();
    const { data, error } = await client
      .from("listing_fee_payments")
      .update({ payment_status: "consumed", listing_id: listingId })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? paymentFromRow(data) : null;
  }

  async getPayment(id: string) {
    const client = this.requireClient();
    const { data, error } = await client
      .from("listing_fee_payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? paymentFromRow(data) : null;
  }
}

export function getRepository() {
  return hasSupabaseConfig() ? new SupabaseRepository() : new MemoryRepository();
}

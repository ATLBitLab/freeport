export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type ListingCategory = "agent_service" | "l402_api" | "l402_workflow";

export type ListingPricingModel =
  | "free_contact"
  | "fixed_sats"
  | "fixed_usd"
  | "l402"
  | "quote_required";

export type InvocationMethod =
  | "https"
  | "l402"
  | "nostr_dm"
  | "email"
  | "webhook"
  | "manual_contact";

export type SellerStatus = "active" | "suspended" | "deleted";

export type ModerationStatus = "active" | "hidden" | "deleted" | "pending";

export type PaymentStatus =
  | "requested"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "consumed";

export type Seller = {
  id: string;
  pubkey: string;
  displayName: string | null;
  contactMethodType: string | null;
  contactMethodValue: string | null;
  walletType: string | null;
  walletMetadata: JsonObject;
  profileName: string | null;
  profileDisplayName: string | null;
  profileAbout: string | null;
  profilePictureUrl: string | null;
  profileWebsite: string | null;
  profileNip05: string | null;
  profileLud16: string | null;
  profileBot: boolean | null;
  profileMetadata: JsonObject;
  profileEventId: string | null;
  profileEventCreatedAt: number | null;
  createdAt: string;
  updatedAt: string;
  status: SellerStatus;
};

export type Listing = {
  id: string;
  sellerId: string;
  eventId: string;
  kind: number;
  category: ListingCategory;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  pricingModel: ListingPricingModel;
  pricingDetails: JsonObject;
  invocationMethod: InvocationMethod;
  invocationUrl: string | null;
  contactInfo: JsonObject;
  sampleInput: JsonValue | null;
  sampleOutput: JsonValue | null;
  requiredCapabilities: string[];
  moderationStatus: ModerationStatus;
  hiddenReason: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export type ListingWithSeller = Listing & {
  seller: Seller | null;
};

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

export type UnsignedNostrEvent = Omit<NostrEvent, "id" | "sig">;

export type ListingEventRecord = {
  id: string;
  listingId: string | null;
  eventId: string;
  pubkey: string;
  kind: number;
  createdAtUnix: number;
  sig: string;
  content: string;
  tags: string[][];
  canonicalJson: string;
  validSignature: boolean;
  supersededByEventId: string | null;
  insertedAt: string;
};

export type ListingFeePayment = {
  id: string;
  sellerId: string | null;
  listingId: string | null;
  invoiceId: string | null;
  paymentStatus: PaymentStatus;
  amountSats: number | null;
  amountUsdCents: number;
  paidAt: string | null;
  proofPayload: JsonObject;
  createdAt: string;
};

export type ListingContent = {
  category: ListingCategory;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  pricing_model: ListingPricingModel;
  pricing_details: JsonObject;
  invocation_method: InvocationMethod;
  invocation_url?: string | null;
  contact_info: JsonObject;
  sample_input?: JsonValue | null;
  sample_output?: JsonValue | null;
  required_capabilities: string[];
  expires_at?: string | null;
};

export type ListingFilters = {
  q?: string;
  category?: ListingCategory;
  tag?: string;
  sellerPubkey?: string;
  limit?: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

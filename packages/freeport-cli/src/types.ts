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

export type NostrVerification =
  | {
      ok: true;
      code: "valid";
      message: string;
    }
  | {
      ok: false;
      code: "event_id_mismatch" | "invalid_signature" | "signature_verification_error";
      message: string;
    };

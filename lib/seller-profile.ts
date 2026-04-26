import type { JsonObject, JsonValue, Seller } from "@/lib/types";

export type SellerProfileData = {
  profileName: string | null;
  profileDisplayName: string | null;
  profileAbout: string | null;
  profilePictureUrl: string | null;
  profileWebsite: string | null;
  profileNip05: string | null;
  profileLud16: string | null;
  profileBot: boolean | null;
  profileMetadata: JsonObject;
};

const STRING_LIMITS = {
  name: 80,
  display_name: 80,
  about: 700,
  nip05: 256,
  lud16: 256,
} as const;

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(metadata: JsonObject, key: keyof typeof STRING_LIMITS) {
  const value = metadata[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Profile ${key} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > STRING_LIMITS[key]) {
    throw new Error(`Profile ${key} must be ${STRING_LIMITS[key]} characters or fewer.`);
  }
  return trimmed;
}

function readUrl(metadata: JsonObject, key: "picture" | "website") {
  const value = metadata[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Profile ${key} must be a URL string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2048) {
    throw new Error(`Profile ${key} URL must be 2048 characters or fewer.`);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Profile ${key} must be a valid URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Profile ${key} must use http or https.`);
  }

  return trimmed;
}

function readBot(metadata: JsonObject) {
  const value = metadata.bot;
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") {
    throw new Error("Profile bot must be a boolean.");
  }
  return value;
}

export function parseSellerProfileContent(raw: string): SellerProfileData {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(raw) as JsonValue;
  } catch {
    throw new Error("Profile content must be valid JSON.");
  }

  if (!isJsonObject(parsed)) {
    throw new Error("Profile content must be a JSON object.");
  }

  return {
    profileName: readString(parsed, "name"),
    profileDisplayName: readString(parsed, "display_name"),
    profileAbout: readString(parsed, "about"),
    profilePictureUrl: readUrl(parsed, "picture"),
    profileWebsite: readUrl(parsed, "website"),
    profileNip05: readString(parsed, "nip05"),
    profileLud16: readString(parsed, "lud16"),
    profileBot: readBot(parsed),
    profileMetadata: parsed,
  };
}

export function shortPubkey(pubkey?: string | null) {
  if (!pubkey) return "Unknown seller";
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-6)}`;
}

export function sellerDisplayName(seller?: Seller | null) {
  return (
    seller?.profileDisplayName ??
    seller?.profileName ??
    seller?.displayName ??
    shortPubkey(seller?.pubkey)
  );
}

export function sellerAvatarInitial(seller?: Seller | null) {
  const label = sellerDisplayName(seller);
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "S";
}

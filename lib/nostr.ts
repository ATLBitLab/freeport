import { hashes, schnorr, utils } from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

import type { NostrEvent, UnsignedNostrEvent } from "@/lib/types";

hashes.sha256 = sha256;

export function canonicalEventPayload(event: UnsignedNostrEvent) {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

export function computeEventId(event: UnsignedNostrEvent) {
  return bytesToHex(sha256(utf8ToBytes(canonicalEventPayload(event))));
}

export function canonicalEventJson(event: NostrEvent) {
  return JSON.stringify({
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  });
}

export function privateKeyToPubkey(privateKeyHex: string) {
  return bytesToHex(schnorr.getPublicKey(hexToBytes(privateKeyHex)));
}

export function generateKeypair() {
  const privateKey = bytesToHex(utils.randomSecretKey());
  return {
    privateKey,
    pubkey: privateKeyToPubkey(privateKey),
  };
}

export function signEvent(event: UnsignedNostrEvent, privateKeyHex: string): NostrEvent {
  const id = computeEventId(event);
  const sig = bytesToHex(schnorr.sign(hexToBytes(id), hexToBytes(privateKeyHex)));
  return { ...event, id, sig };
}

export function verifyNostrEvent(event: NostrEvent) {
  const unsigned = {
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
  };
  const computedId = computeEventId(unsigned);
  if (computedId !== event.id) {
    return {
      ok: false,
      code: "event_id_mismatch",
      message: "Event id does not match the canonical serialized payload hash.",
    };
  }

  try {
    const verified = schnorr.verify(
      hexToBytes(event.sig),
      hexToBytes(event.id),
      hexToBytes(event.pubkey),
    );
    if (!verified) {
      return {
        ok: false,
        code: "invalid_signature",
        message: "Event signature is not valid for the supplied pubkey.",
      };
    }
  } catch (error) {
    return {
      ok: false,
      code: "signature_verification_error",
      message: error instanceof Error ? error.message : "Unable to verify event signature.",
    };
  }

  return { ok: true, code: "valid", message: "Event signature is valid." };
}

export function makeSigningTemplate(input: {
  pubkey: string;
  kind: number;
  content: unknown;
  tags?: string[][];
}) {
  const content = JSON.stringify(input.content);
  const event: UnsignedNostrEvent = {
    pubkey: input.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: input.kind,
    tags: input.tags ?? [],
    content,
  };

  return {
    ...event,
    id_hint: computeEventId(event),
    canonical_payload: canonicalEventPayload(event),
  };
}

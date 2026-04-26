import assert from "node:assert/strict";
import test from "node:test";

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

import {
  canonicalEventPayload,
  computeEventId,
  generateKeypair,
  privateKeyToPubkey,
  signListingContent,
  verifyNostrEvent,
} from "../dist/protocol.js";

const listing = {
  category: "agent_service",
  title: "Agent release note drafter",
  summary: "Turns merged pull requests into release notes.",
  description:
    "Send a repository and commit range. The agent groups related changes and returns release notes in markdown and JSON forms.",
  tags: ["github", "release"],
  pricing_model: "quote_required",
  pricing_details: {},
  invocation_method: "https",
  invocation_url: "https://example.com/agents/release-notes",
  contact_info: { email: "seller@example.com" },
  sample_input: {},
  sample_output: {},
  required_capabilities: ["github_read"],
};

test("generates Schnorr-compatible keypairs", () => {
  const keypair = generateKeypair();

  assert.match(keypair.privateKey, /^[0-9a-f]{64}$/);
  assert.match(keypair.pubkey, /^[0-9a-f]{64}$/);
  assert.equal(privateKeyToPubkey(keypair.privateKey), keypair.pubkey);
});

test("computes canonical Nostr event ids", () => {
  const event = {
    pubkey: "f".repeat(64),
    created_at: 1777132800,
    kind: 33001,
    tags: [["category", "agent_service"]],
    content: "{}",
  };
  const payload = canonicalEventPayload(event);

  assert.equal(
    payload,
    JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]),
  );
  assert.equal(computeEventId(event), bytesToHex(sha256(utf8ToBytes(payload))));
});

test("signs and verifies listing events", () => {
  const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
  const event = signListingContent({ content: listing, privateKey, createdAt: 1777132800 });
  const verification = verifyNostrEvent(event);

  assert.equal(event.pubkey, privateKeyToPubkey(privateKey));
  assert.equal(event.kind, 33001);
  assert.deepEqual(event.tags, [
    ["category", "agent_service"],
    ["t", "github"],
    ["t", "release"],
    ["pricing", "quote_required"],
  ]);
  assert.equal(verification.ok, true);
});

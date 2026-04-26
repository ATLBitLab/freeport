import { createHash } from "crypto";

import { getCanonicalUrl } from "@/lib/env";

export const FREEPORT_AGENT_SKILL_NAME = "freeport-marketplace";

export const FREEPORT_AGENT_SKILL_MARKDOWN = `---
name: freeport-marketplace
description: Browse Freeport listings and publish signed agent work listings through the Freeport HTTP API.
---

# Freeport Marketplace

Use this skill when an agent needs to discover agent services, L402 APIs, or paid workflows listed on Freeport, or when a seller agent needs to publish a listing.

## Discover Listings

1. Read \`/llms.txt\` for the current agent-facing API summary.
2. Call \`GET /api/categories\` to inspect supported listing categories.
3. Call \`GET /api/listings\` or \`GET /api/search?q={query}\` to browse active listings.
4. Use \`GET /api/listings/{id}\` for detail and contact or invocation metadata.

## Publish A Listing

1. Generate a secp256k1 Schnorr keypair and keep the private key local.
2. Build listing content with category, title, summary, description, pricing metadata, tags, and either an invocation URL or contact info.
3. Create a Nostr-shaped event with kind \`33001\`, canonicalize it, and sign it locally.
4. In local development, request a receipt from \`POST /api/listing-fee/request\` and include \`listing_fee_payment_id\`.
5. In production, post to \`POST /api/listings\` and satisfy the returned L402 challenge before retrying with \`Authorization: L402 <macaroon>:<preimage>\`.

## Useful Resources

- API catalog: \`/.well-known/api-catalog\`
- OpenAPI description: \`/openapi.json\`
- Human API docs: \`/docs/api\`
- Agent guide: \`/docs/agents\`
`;

export function sha256Digest(value: string) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function getAgentSkillsIndex() {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: FREEPORT_AGENT_SKILL_NAME,
        type: "skill-md",
        description:
          "Browse Freeport marketplace listings and publish signed agent work listings through the Freeport HTTP API.",
        url: getCanonicalUrl(`/.well-known/agent-skills/${FREEPORT_AGENT_SKILL_NAME}/SKILL.md`),
        digest: sha256Digest(FREEPORT_AGENT_SKILL_MARKDOWN),
      },
    ],
  };
}

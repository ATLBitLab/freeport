import assert from "node:assert/strict";

import { renderToStaticMarkup } from "react-dom/server";

import { ListingCard } from "../components/listing-card";
import { EVENT_KINDS } from "../lib/constants";
import { listingToPublicJson } from "../lib/event-mapping";
import { privateKeyToPubkey, signEvent } from "../lib/nostr";
import { getRepository } from "../lib/repository";
import type { ListingContent, NostrEvent } from "../lib/types";

delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_SECRET_KEY;
delete process.env.MDK_ACCESS_TOKEN;
delete process.env.MDK_MNEMONIC;

const privateKey = "0000000000000000000000000000000000000000000000000000000000000009";
const pubkey = privateKeyToPubkey(privateKey);
const pictureUrl = "https://example.com/profiles/profile-check.png";

function profileEvent(createdAt: number, metadata: Record<string, unknown>) {
  return signEvent(
    {
      pubkey,
      created_at: createdAt,
      kind: EVENT_KINDS.sellerProfile,
      tags: [],
      content: JSON.stringify(metadata),
    },
    privateKey,
  );
}

async function postProfile(event: NostrEvent) {
  const { POST } = await import("../app/api/sellers/profile/route");
  const response = await POST(
    new Request("http://localhost/api/sellers/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
    }),
  );
  return { response, body: await response.json() };
}

async function main() {
  const newer = profileEvent(200, {
    name: "Profile Check Seller",
    display_name: "Signed Profile Check",
    about: "Seller profile check fixture.",
    picture: pictureUrl,
    website: "https://example.com/profile-check",
    nip05: "profile@example.com",
    lud16: "profile@example.com",
    bot: true,
    custom_field: "preserved",
  });

  const valid = await postProfile(newer);
  assert.equal(valid.response.status, 200);
  assert.equal(valid.body.profile_updated, true);
  assert.equal(valid.body.seller.profile_display_name, "Signed Profile Check");
  assert.equal(valid.body.seller.profile_metadata.custom_field, "preserved");

  const invalidSignature = await postProfile({ ...newer, sig: "0".repeat(128) });
  assert.equal(invalidSignature.response.status, 422);
  assert.equal(invalidSignature.body.error.code, "invalid_signature");

  const nonJson = signEvent(
    {
      pubkey,
      created_at: 201,
      kind: EVENT_KINDS.sellerProfile,
      tags: [],
      content: "not-json",
    },
    privateKey,
  );
  const nonJsonResponse = await postProfile(nonJson);
  assert.equal(nonJsonResponse.response.status, 400);
  assert.equal(nonJsonResponse.body.error.code, "bad_request");

  const older = profileEvent(100, {
    name: "Older Profile",
    display_name: "Older Profile",
    picture: "https://example.com/profiles/older.png",
  });
  const oldResponse = await postProfile(older);
  assert.equal(oldResponse.response.status, 200);
  assert.equal(oldResponse.body.profile_updated, false);
  assert.equal(oldResponse.body.seller.profile_display_name, "Signed Profile Check");

  const storedOlder = await getRepository().getEvent(older.id);
  assert.ok(storedOlder);
  assert.equal(storedOlder.listingId, null);

  const latest = profileEvent(300, {
    name: "Latest Profile",
    display_name: "Latest Profile",
    picture: pictureUrl,
  });
  const latestResponse = await postProfile(latest);
  assert.equal(latestResponse.response.status, 200);
  assert.equal(latestResponse.body.profile_updated, true);
  assert.equal(latestResponse.body.seller.profile_display_name, "Latest Profile");

  const listingPayload: ListingContent = {
    category: "agent_service",
    title: "Profile picture render check",
    summary: "Checks that profile picture URLs flow into listing card rendering.",
    description:
      "This fixture listing exercises the signed seller profile data in listing public JSON and the listing card UI.",
    tags: ["profile", "check"],
    pricing_model: "quote_required",
    pricing_details: {},
    invocation_method: "https",
    invocation_url: "https://example.com/profile-check/invoke",
    contact_info: { url: "https://example.com/profile-check" },
    required_capabilities: ["http"],
  };
  const listingEvent = signEvent(
    {
      pubkey,
      created_at: 301,
      kind: EVENT_KINDS.listing,
      tags: [["category", listingPayload.category]],
      content: JSON.stringify(listingPayload),
    },
    privateKey,
  );
  const listing = await getRepository().createListingFromEvent(listingEvent, null);
  const publicJson = listingToPublicJson(listing);
  assert.equal(publicJson.seller?.profile_picture_url, pictureUrl);

  const markup = renderToStaticMarkup(<ListingCard listing={listing} />);
  assert.ok(markup.includes(pictureUrl));

  console.log("profile flow checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

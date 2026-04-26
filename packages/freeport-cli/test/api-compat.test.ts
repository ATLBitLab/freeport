import assert from "node:assert/strict";
import test from "node:test";

import { signListingContent } from "../dist/protocol.js";

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

test("CLI-signed listing events pass the app verifier", async () => {
  const appNostr = await import("../../../lib/nostr.ts");
  const verifyNostrEvent =
    appNostr.verifyNostrEvent ??
    appNostr.default?.verifyNostrEvent ??
    appNostr["module.exports"]?.verifyNostrEvent;
  const event = signListingContent({
    content: listing,
    privateKey: "0000000000000000000000000000000000000000000000000000000000000001",
    createdAt: 1777132800,
  });

  assert.equal(verifyNostrEvent(event).ok, true);
});

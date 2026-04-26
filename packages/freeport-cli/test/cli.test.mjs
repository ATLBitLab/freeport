import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { run as runCli } from "../dist/cli.js";

const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";

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

function spawnCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function tempWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "freeport-cli-"));
  const listingPath = join(dir, "listing.json");
  writeFileSync(listingPath, `${JSON.stringify(listing, null, 2)}\n`);
  return { dir, listingPath };
}

test("keygen writes a 0600 private key and protects existing files", () => {
  const { dir } = tempWorkspace();
  const keyPath = join(dir, "seller.key");

  const first = spawnCli(["keygen", "--out", keyPath], dir);
  assert.equal(first.status, 0, first.stderr);
  assert.match(readFileSync(keyPath, "utf8"), /^[0-9a-f]{64}$/);
  assert.equal(statSync(keyPath).mode & 0o777, 0o600);
  assert.match(JSON.parse(first.stdout).pubkey, /^[0-9a-f]{64}$/);

  const original = readFileSync(keyPath, "utf8");
  const second = spawnCli(["keygen", "--out", keyPath], dir);
  assert.equal(second.status, 1);
  assert.match(second.stderr, /already exists/);
  assert.equal(readFileSync(keyPath, "utf8"), original);
});

test("sign and verify round trip through the CLI", () => {
  const { dir, listingPath } = tempWorkspace();
  const keyPath = join(dir, "seller.key");
  const signedPath = join(dir, "signed-event.json");

  assert.equal(spawnCli(["keygen", "--out", keyPath], dir).status, 0);

  const sign = spawnCli(["sign", listingPath, "--key", keyPath, "--out", signedPath], dir);
  assert.equal(sign.status, 0, sign.stderr);
  const signed = JSON.parse(readFileSync(signedPath, "utf8"));
  assert.match(signed.event.id, /^[0-9a-f]{64}$/);
  assert.match(signed.event.sig, /^[0-9a-f]{128}$/);

  const verify = spawnCli(["verify", signedPath], dir);
  assert.equal(verify.status, 0, verify.stderr);
  assert.equal(JSON.parse(verify.stdout).valid, true);
});

test("sign rejects invalid listing JSON", () => {
  const { dir } = tempWorkspace();
  const keyPath = join(dir, "seller.key");
  const invalidPath = join(dir, "invalid.json");

  assert.equal(spawnCli(["keygen", "--out", keyPath], dir).status, 0);
  writeFileSync(
    invalidPath,
    JSON.stringify({
      ...listing,
      invocation_url: "",
      contact_info: {},
    }),
  );

  const result = spawnCli(["sign", invalidPath, "--key", keyPath], dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Listing requires invocation_url/);
});

test("sign rejects invalid key files", () => {
  const { dir, listingPath } = tempWorkspace();
  const keyPath = join(dir, "seller.key");
  writeFileSync(keyPath, "not-a-key");

  const result = spawnCli(["sign", listingPath, "--key", keyPath], dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /64-character lowercase hex/);
});

test("post prints 402 responses and keeps private keys out of API bodies", async () => {
  const { dir, listingPath } = tempWorkspace();
  const keyPath = join(dir, "seller.key");
  writeFileSync(keyPath, privateKey);

  const requests = [];
  let stdout = "";
  let stderr = "";
  const io = {
    stdout: { write: (chunk) => { stdout += chunk; return true; } },
    stderr: { write: (chunk) => { stderr += chunk; return true; } },
    fetch: async (url, init) => {
      requests.push({ url: String(url), body: String(init?.body ?? "") });
      if (String(url).endsWith("/api/listing-fee/request")) {
        return new Response(JSON.stringify({ payment: { id: "10000000-0000-4000-8000-000000000001" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: { code: "payment_required", message: "Pay invoice." } }), {
        status: 402,
        headers: { "content-type": "application/json" },
      });
    },
  };

  await assert.rejects(
    () => runCli(["post", listingPath, "--key", keyPath, "--base", "https://freeport.example"], io),
    (error) => error?.exitCode === 2,
  );

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, "https://freeport.example/api/listing-fee/request");
  assert.equal(requests[1].url, "https://freeport.example/api/listings");
  assert.equal(requests.every((request) => !request.body.includes(privateKey)), true);
  assert.match(stdout, /payment_required/);
  assert.match(stderr, /retry with --authorization/);
});

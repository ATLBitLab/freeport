import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { EVENT_KINDS } from "../lib/constants";
import { generateKeypair, privateKeyToPubkey, signEvent } from "../lib/nostr";
import type { ListingContent, NostrEvent } from "../lib/types";

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]) {
  const args: Args = {};
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        index += 1;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(value);
    }
  }

  return { args, positional };
}

function usage() {
  console.log(`Freeport agent helper

Commands:
  keygen --out ./seller.key
  sign examples/listing.json --key ./seller.key --out signed-event.json
  post examples/listing.json --key ./seller.key --base http://localhost:3000

Secrets:
  The private key file is raw 64-character hex. Keep it outside source control.`);
}

function readKey(path?: string) {
  if (!path) throw new Error("--key is required.");
  return readFileSync(path, "utf8").trim();
}

function readListing(path?: string) {
  if (!path) throw new Error("A listing JSON file path is required.");
  return JSON.parse(readFileSync(path, "utf8")) as ListingContent;
}

function signListing(content: ListingContent, privateKey: string): NostrEvent {
  const pubkey = privateKeyToPubkey(privateKey);
  return signEvent(
    {
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: EVENT_KINDS.listing,
      tags: [
        ["category", content.category],
        ...content.tags.map((tag) => ["t", tag]),
        ["pricing", content.pricing_model],
      ],
      content: JSON.stringify(content),
    },
    privateKey,
  );
}

async function postListing(base: string, event: NostrEvent, authorization?: string) {
  const feeResponse = await fetch(`${base}/api/listing-fee/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pubkey: event.pubkey, listing_title: JSON.parse(event.content).title }),
  });
  const fee = await feeResponse.json();

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (authorization) headers.authorization = authorization;

  const listingResponse = await fetch(`${base}/api/listings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event,
      listing_fee_payment_id: fee.payment?.id,
    }),
  });
  const body = await listingResponse.json();

  if (listingResponse.status === 402) {
    console.log(JSON.stringify(body, null, 2));
    console.error("Payment required. Pay invoice, then retry with --authorization 'L402 <macaroon>:<preimage>'.");
    process.exit(2);
  }

  if (!listingResponse.ok) {
    console.log(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(body, null, 2));
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { args, positional } = parseArgs(rest);

  if (!command || command === "help") {
    usage();
    return;
  }

  if (command === "keygen") {
    const keys = generateKeypair();
    const out = typeof args.out === "string" ? args.out : undefined;
    if (out) {
      if (existsSync(out) && !args.force) {
        throw new Error(`${out} already exists. Use --force to overwrite.`);
      }
      writeFileSync(out, `${keys.privateKey}\n`, { mode: 0o600 });
    }
    console.log(JSON.stringify({ pubkey: keys.pubkey, private_key_file: out ?? null }, null, 2));
    if (!out) console.error(`private_key=${keys.privateKey}`);
    return;
  }

  if (command === "sign") {
    const listing = readListing(positional[0]);
    const event = signListing(listing, readKey(typeof args.key === "string" ? args.key : undefined));
    const out = typeof args.out === "string" ? args.out : `${basename(positional[0] ?? "listing.json")}.signed.json`;
    writeFileSync(out, `${JSON.stringify({ event }, null, 2)}\n`);
    console.log(JSON.stringify({ event_id: event.id, pubkey: event.pubkey, out }, null, 2));
    return;
  }

  if (command === "post") {
    const listing = readListing(positional[0]);
    const event = signListing(listing, readKey(typeof args.key === "string" ? args.key : undefined));
    await postListing(
      typeof args.base === "string" ? args.base.replace(/\/$/, "") : "http://localhost:3000",
      event,
      typeof args.authorization === "string" ? args.authorization : undefined,
    );
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

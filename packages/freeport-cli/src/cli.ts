#!/usr/bin/env node
import { chmodSync, existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { generateKeypair, signListingContent, verifyNostrEvent } from "./protocol.js";
import { parseListingContent, parseSignedEvent } from "./validation.js";
import type { NostrEvent } from "./types.js";

type Args = Record<string, string | boolean>;

type CliIO = {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
  fetch: typeof fetch;
};

class CliError extends Error {
  readonly exitCode: number;
  readonly showMessage: boolean;

  constructor(message: string, exitCode = 1, showMessage = true) {
    super(message);
    this.exitCode = exitCode;
    this.showMessage = showMessage;
  }
}

function defaultIO(): CliIO {
  if (!globalThis.fetch) {
    throw new CliError("This CLI requires Node.js 20 or newer with global fetch support.");
  }
  return {
    stdout: process.stdout,
    stderr: process.stderr,
    fetch: globalThis.fetch.bind(globalThis),
  };
}

function parseArgs(argv: string[]) {
  const args: Args = {};
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      const [key, inlineValue] = value.slice(2).split(/=(.*)/s, 2);
      if (inlineValue !== undefined) {
        args[key] = inlineValue;
        continue;
      }
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

function getStringArg(args: Args, key: string) {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

function writeJson(io: CliIO, value: unknown) {
  io.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(io: CliIO) {
  io.stdout.write(`Freeport agent CLI

Usage:
  freeport keygen --out ./seller.key
  freeport sign examples/listing.json --key ./seller.key --out signed-event.json
  freeport verify signed-event.json [--base http://localhost:3000]
  freeport post examples/listing.json --key ./seller.key --base http://localhost:3000 [--authorization 'L402 <macaroon>:<preimage>']

Agent examples:
  npx @atlbitlab/freeport-cli@latest keygen --out ./seller.key
  npx @atlbitlab/freeport-cli@latest sign examples/listing.json --key ./seller.key --out signed-event.json
  npx @atlbitlab/freeport-cli@latest verify signed-event.json
  npx @atlbitlab/freeport-cli@latest post examples/listing.json --key ./seller.key --base https://freeport.example

Repo-local equivalents:
  pnpm freeport:keygen --out ./seller.key
  pnpm freeport:sign examples/listing.json --key ./seller.key --out signed-event.json
  pnpm freeport:verify signed-event.json
  pnpm freeport:post examples/listing.json --key ./seller.key --base http://localhost:3000

Private keys are raw 64-character lowercase hex files. Keep them outside source control.
Do not hand-roll Nostr signing or use ECDSA; this CLI signs listing events with Schnorr.
`);
}

function readJsonFile(path: string | undefined, label: string) {
  if (!path) throw new CliError(`${label} file path is required.`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CliError(`${path} is not valid JSON: ${error.message}`);
    }
    throw error;
  }
}

function readListing(path: string | undefined) {
  return parseListingContent(readJsonFile(path, "Listing JSON"));
}

function readKey(path: string | undefined) {
  if (!path) throw new CliError("--key is required.");
  return readFileSync(path, "utf8").trim();
}

function formatError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("\n");
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

async function requestJson(io: CliIO, url: string, body: unknown, headers?: Record<string, string>) {
  const response = await io.fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return {
    response,
    body: await readJsonResponse(response),
  };
}

function signedEventFromFile(path: string | undefined) {
  return parseSignedEvent(readJsonFile(path, "Signed event JSON"));
}

async function verifyEvent(io: CliIO, event: NostrEvent, base?: string) {
  const local = verifyNostrEvent(event);
  const result: Record<string, unknown> = {
    valid: local.ok,
    local,
  };

  if (base) {
    const normalizedBase = base.replace(/\/$/, "");
    const server = await requestJson(io, `${normalizedBase}/api/events/verify`, { event });
    result.server = {
      status: server.response.status,
      ok: server.response.ok,
      body: server.body,
    };
    if (!server.response.ok) {
      writeJson(io, result);
      throw new CliError("Server verification failed.", 1, false);
    }
  }

  writeJson(io, result);
  if (!local.ok) {
    throw new CliError(local.message, 1, false);
  }
}

async function postListing(io: CliIO, input: {
  base: string;
  event: NostrEvent;
  authorization?: string;
}) {
  const base = input.base.replace(/\/$/, "");
  const listingContent = parseListingContent(input.event.content);
  const fee = await requestJson(io, `${base}/api/listing-fee/request`, {
    pubkey: input.event.pubkey,
    listing_title: listingContent.title,
  });

  if (!fee.response.ok) {
    writeJson(io, fee.body);
    throw new CliError(`Listing fee request failed with HTTP ${fee.response.status}.`, 1, false);
  }

  const paymentId =
    fee.body && typeof fee.body === "object" && "payment" in fee.body
      ? (fee.body as { payment?: { id?: unknown } }).payment?.id
      : undefined;
  const headers: Record<string, string> = {};
  if (input.authorization) headers.authorization = input.authorization;

  const listing = await requestJson(
    io,
    `${base}/api/listings`,
    {
      event: input.event,
      listing_fee_payment_id: typeof paymentId === "string" ? paymentId : undefined,
    },
    headers,
  );

  if (listing.response.status === 402) {
    writeJson(io, listing.body);
    io.stderr.write(
      "Payment required. Pay the returned L402 invoice, then retry with --authorization 'L402 <macaroon>:<preimage>'.\n",
    );
    throw new CliError("", 2, false);
  }

  if (!listing.response.ok) {
    writeJson(io, listing.body);
    throw new CliError(`Listing post failed with HTTP ${listing.response.status}.`, 1, false);
  }

  writeJson(io, listing.body);
}

export async function run(argv: string[], io: CliIO = defaultIO()) {
  const [command, ...rest] = argv;
  const { args, positional } = parseArgs(rest);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage(io);
    return;
  }

  if (command === "keygen") {
    const out = getStringArg(args, "out");
    if (!out) throw new CliError("--out is required.");
    if (existsSync(out) && !args.force) {
      throw new CliError(`${out} already exists. Use --force to overwrite.`);
    }
    const keys = generateKeypair();
    writeFileSync(out, keys.privateKey, { mode: 0o600, flag: args.force ? "w" : "wx" });
    chmodSync(out, 0o600);
    writeJson(io, { pubkey: keys.pubkey, private_key_file: out });
    return;
  }

  if (command === "sign") {
    const listing = readListing(positional[0]);
    const event = signListingContent({
      content: listing,
      privateKey: readKey(getStringArg(args, "key")),
    });
    const out = getStringArg(args, "out") ?? `${basename(positional[0] ?? "listing.json")}.signed.json`;
    writeFileSync(out, `${JSON.stringify({ event }, null, 2)}\n`);
    writeJson(io, { event_id: event.id, pubkey: event.pubkey, out });
    return;
  }

  if (command === "verify") {
    await verifyEvent(io, signedEventFromFile(positional[0]), getStringArg(args, "base"));
    return;
  }

  if (command === "post") {
    const base = getStringArg(args, "base");
    if (!base) throw new CliError("--base is required.");
    const event = signListingContent({
      content: readListing(positional[0]),
      privateKey: readKey(getStringArg(args, "key")),
    });
    await postListing(io, {
      base,
      event,
      authorization: getStringArg(args, "authorization"),
    });
    return;
  }

  throw new CliError(`Unknown command: ${command}`);
}

export async function main(argv = process.argv.slice(2), io = defaultIO()) {
  try {
    await run(argv, io);
  } catch (error) {
    if (error instanceof CliError) {
      if (error.showMessage && error.message) io.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
      return;
    }
    io.stderr.write(`${formatError(error)}\n`);
    process.exitCode = 1;
  }
}

function isDirectCli() {
  const invokedPath = process.argv[1] ? realpathSync(resolve(process.argv[1])) : "";
  return invokedPath === realpathSync(fileURLToPath(import.meta.url));
}

if (isDirectCli()) {
  void main();
}

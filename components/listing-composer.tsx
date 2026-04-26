"use client";

import { AlertCircle, Check, KeyRound, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { generateKeypair, privateKeyToPubkey, signListingContent } from "@/lib/nostr";
import type { ListingCategory, ListingContent } from "@/lib/types";

type Status = { type: "idle" | "ok" | "error"; message: string; details?: unknown };
const DEFAULT_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000009";
const DEFAULT_KEYS = {
  privateKey: DEFAULT_PRIVATE_KEY,
  pubkey: privateKeyToPubkey(DEFAULT_PRIVATE_KEY),
};

export function ListingComposer() {
  const [keys, setKeys] = useState(DEFAULT_KEYS);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const shortPubkey = useMemo(() => `${keys.pubkey.slice(0, 10)}...${keys.pubkey.slice(-8)}`, [keys]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "idle", message: "Preparing signed listing event..." });
    const form = new FormData(event.currentTarget);

    const payload: ListingContent = {
      category: form.get("category") as ListingCategory,
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      description: String(form.get("description") ?? ""),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      pricing_model: "quote_required",
      pricing_details: { note: "Demo composer defaults to quote_required." },
      invocation_method: "https",
      invocation_url: String(form.get("invocation_url") ?? ""),
      contact_info: { email: String(form.get("email") ?? "") },
      sample_input: null,
      sample_output: null,
      required_capabilities: [],
    };

    try {
      const feeResponse = await fetch("/api/listing-fee/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pubkey: keys.pubkey, listing_title: payload.title }),
      });
      const feeJson = await feeResponse.json();
      if (!feeResponse.ok) {
        setStatus({
          type: "error",
          message: feeJson.error?.message ?? "Listing fee request failed.",
          details: feeJson,
        });
        return;
      }

      const signed = signListingContent({
        content: payload,
        privateKey: keys.privateKey,
      });

      const listingResponse = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: signed,
          listing_fee_payment_id: feeJson.payment?.id,
        }),
      });
      const listingJson = await listingResponse.json();

      if (!listingResponse.ok) {
        setStatus({
          type: "error",
          message:
            listingResponse.status === 402
              ? "Production posting returned an L402 payment challenge. Agent clients should pay and retry with Authorization."
              : listingJson.error?.message ?? "Listing publish failed.",
          details: listingJson,
        });
        return;
      }

      setStatus({
        type: "ok",
        message: `Published ${listingJson.listing.title}.`,
        details: listingJson,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected publish failure.",
      });
    }
  }

  return (
    <section className="card grid gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label text-[var(--muted)]">Harbor publisher</p>
          <h2 className="text-2xl font-black">Sign and post a listing</h2>
        </div>
        <button className="button-ghost" type="button" onClick={() => setKeys(generateKeypair())}>
          <KeyRound size={16} aria-hidden />
          New key
        </button>
      </div>

      <div className="rounded-[var(--radius)] bg-[var(--panel-strong)] p-3 font-mono text-xs leading-5 text-[var(--muted)]">
        pubkey {shortPubkey}
      </div>

      <form className="grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Title</span>
            <input className="field" name="title" required minLength={4} defaultValue="Agent inbox triage" />
          </label>
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Category</span>
            <select className="field" name="category" defaultValue="agent_service">
              <option value="agent_service">Agent service</option>
              <option value="l402_api">L402 API</option>
              <option value="l402_workflow">L402 workflow</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span className="label text-[var(--muted)]">Summary</span>
          <input
            className="field"
            name="summary"
            required
            minLength={12}
            defaultValue="Sorts an agent inbox into urgent work, blocked threads, and quick wins."
          />
        </label>
        <label className="grid gap-1">
          <span className="label text-[var(--muted)]">Description</span>
          <textarea
            className="field min-h-32"
            name="description"
            required
            minLength={40}
            defaultValue="Send a bundle of inbox messages and this service returns a prioritized queue, recommended next actions, and any missing context the buyer should collect before execution."
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Invocation URL</span>
            <input className="field" name="invocation_url" type="url" defaultValue="https://example.com/agent/inbox" />
          </label>
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Contact email</span>
            <input className="field" name="email" type="email" defaultValue="seller@example.com" />
          </label>
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Tags</span>
            <input className="field" name="tags" defaultValue="ops,email,triage" />
          </label>
        </div>
        <button className="button-primary justify-self-start" type="submit">
          <Send size={16} aria-hidden />
          Publish listing
        </button>
      </form>

      {status.message ? (
        <div
          className={`flex items-start gap-3 rounded-[var(--radius)] border p-4 ${
            status.type === "ok"
              ? "border-[color-mix(in_oklch,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklch,var(--accent)_11%,var(--panel))]"
              : "border-[color-mix(in_oklch,var(--signal)_48%,var(--line))] bg-[color-mix(in_oklch,var(--signal)_13%,var(--panel))]"
          }`}
        >
          {status.type === "ok" ? <Check size={18} aria-hidden /> : <AlertCircle size={18} aria-hidden />}
          <div className="grid gap-2 text-sm">
            <p className="font-bold">{status.message}</p>
            {status.details ? (
              <pre className="max-h-44 overflow-auto whitespace-pre-wrap font-mono text-xs">
                {JSON.stringify(status.details, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

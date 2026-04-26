import { EVENT_KINDS } from "@/lib/constants";
import { listingFromEvent } from "@/lib/event-mapping";
import { privateKeyToPubkey, signEvent } from "@/lib/nostr";
import type { ListingContent, ListingWithSeller, NostrEvent, Seller } from "@/lib/types";
import { pricingModelType } from "@/lib/validation";

const keys = [
  "0000000000000000000000000000000000000000000000000000000000000001",
  "0000000000000000000000000000000000000000000000000000000000000002",
  "0000000000000000000000000000000000000000000000000000000000000003",
  "0000000000000000000000000000000000000000000000000000000000000004",
  "0000000000000000000000000000000000000000000000000000000000000005",
  "0000000000000000000000000000000000000000000000000000000000000006",
  "0000000000000000000000000000000000000000000000000000000000000007",
  "0000000000000000000000000000000000000000000000000000000000000008",
];

function seller(pubkey: string, index: number, displayName: string): Seller {
  const now = new Date("2026-04-25T16:00:00.000Z").toISOString();
  return {
    id: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    pubkey,
    displayName,
    contactMethodType: "https",
    contactMethodValue: `https://freeport.local/demo/${displayName.toLowerCase().replaceAll(" ", "-")}`,
    walletType: "moneydevkit_agent_wallet",
    walletMetadata: { network: "mainnet", recommended_client: "agent-wallet" },
    createdAt: now,
    updatedAt: now,
    status: "active",
  };
}

function content(input: ListingContent): string {
  return JSON.stringify(input);
}

function buildEvent(
  privateKey: string,
  pubkey: string,
  createdAt: number,
  sellerName: string,
  payload: ListingContent,
) {
  const eventPayload: ListingContent =
    payload.category === "agent_service"
      ? {
          ...payload,
          seller: {
            display_name: sellerName,
            pubkey,
          },
        }
      : payload;

  return signEvent(
    {
      pubkey,
      created_at: createdAt,
      kind: EVENT_KINDS.listing,
      tags: [
        ["category", eventPayload.category],
        ...eventPayload.tags.map((tag) => ["t", tag]),
        ["pricing", pricingModelType(eventPayload.pricing_model)],
      ],
      content: content(eventPayload),
    },
    privateKey,
  );
}

const listings: Array<{ privateKey: string; sellerName: string; createdAt: number; payload: ListingContent }> = [
  {
    privateKey: keys[0],
    sellerName: "Review Cartographer",
    createdAt: 1777132800,
    payload: {
      category: "agent_service",
      title: "PR review synthesis agent",
      summary: "Summarizes unresolved PR review threads into an owner-ready action plan.",
      description:
        "Send a GitHub pull request URL and this agent returns a concise map of blocking comments, likely fixes, and risk areas. It is tuned for maintainers who need to hand a messy review back to an implementation agent.",
      tags: ["github", "reviews", "code"],
      contact_methods: [
        {
          type: "email",
          value: "review-cartographer@example.com",
          label: "Primary contact",
          preferred: true,
        },
      ],
      payment_methods: [
        {
          type: "bolt12_offer",
          value: "lno1reviewcartographerdemo",
          label: "Primary payment offer",
          preferred: true,
        },
      ],
      pricing_model: {
        type: "quote_required",
        currency: "USD",
        notes: "Send the PR URL and review scope for a quote. Typical reviews start around $2.",
      },
      delivery_method: "async_contact",
      turnaround: { typical: "under 3 minutes for typical PRs", rush_available: false },
      service_area: { mode: "remote", languages: ["en"] },
      capabilities: ["PR review synthesis", "blocking comment extraction", "risk summarization"],
      requirements: ["Provide a GitHub pull request URL", "Confirm the repository is readable"],
      availability: { status: "open" },
      metadata: { version: "v1" },
      pricing_details: { starts_at_usd: 2, turnaround: "under 3 minutes for typical PRs" },
      invocation_method: "https",
      invocation_url: "https://example.com/agents/review-cartographer",
      contact_info: { url: "https://example.com/agents/review-cartographer", nostr: "demo-review" },
      sample_input: { pull_request_url: "https://github.com/acme/app/pull/42" },
      sample_output: { blockers: 3, summary: "Two schema issues and one missing test." },
      required_capabilities: ["github_read"],
    },
  },
  {
    privateKey: keys[1],
    sellerName: "Ledger Lens",
    createdAt: 1777132860,
    payload: {
      category: "agent_service",
      title: "CSV to bookkeeping categorizer",
      summary: "Classifies messy bank CSV rows into plain-English bookkeeping categories.",
      description:
        "Upload a CSV export and receive normalized merchant names, categories, and explanation fields. The agent is optimized for small Bitcoin orgs and operators who need repeatable monthly close prep.",
      tags: ["bookkeeping", "csv", "finance"],
      contact_methods: [
        {
          type: "email",
          value: "ledger-lens@example.com",
          label: "Primary contact",
          preferred: true,
        },
      ],
      payment_methods: [
        {
          type: "bolt12_offer",
          value: "lno1ledgerlensdemo",
          label: "Primary payment offer",
          preferred: true,
        },
      ],
      pricing_model: {
        type: "fixed",
        currency: "USD",
        amount: 5,
        notes: "Fixed price per CSV file after scope confirmation.",
      },
      delivery_method: "async_contact",
      turnaround: { typical: "same day", rush_available: true },
      service_area: { mode: "remote", languages: ["en"] },
      capabilities: ["transaction categorization", "merchant normalization", "monthly close prep"],
      requirements: ["Provide a CSV export", "Confirm expected output categories"],
      availability: { status: "limited" },
      metadata: { version: "v1" },
      pricing_details: { amount_usd: 5, unit: "per file" },
      invocation_method: "webhook",
      invocation_url: "https://example.com/workflows/ledger-lens",
      contact_info: { webhook: "https://example.com/workflows/ledger-lens" },
      sample_input: { csv_url: "https://files.example.com/export.csv" },
      sample_output: { rows: 128, categorized: 126, review_needed: 2 },
      required_capabilities: ["file_fetch", "csv_parse"],
    },
  },
  {
    privateKey: keys[2],
    sellerName: "Doc Dock",
    createdAt: 1777132920,
    payload: {
      category: "agent_service",
      title: "API documentation normalizer",
      summary: "Turns scattered endpoint notes into agent-readable API documentation.",
      description:
        "Provide OpenAPI fragments, README notes, or route handler files. The service returns stable endpoint docs, error tables, and compact examples suitable for llms.txt routing.",
      tags: ["docs", "api", "llms"],
      contact_methods: [
        {
          type: "email",
          value: "doc-dock@example.com",
          label: "Primary contact",
          preferred: true,
        },
      ],
      payment_methods: [
        {
          type: "lightning_address",
          value: "doc-dock@example.com",
          label: "Lightning address",
          preferred: true,
        },
      ],
      pricing_model: {
        type: "quote_required",
        currency: "BTC",
        notes: "Send endpoint count and source material for a quote.",
      },
      delivery_method: "email",
      turnaround: { typical: "1-2 days", rush_available: false },
      service_area: { mode: "remote", languages: ["en"] },
      capabilities: ["API docs", "error tables", "agent-readable examples"],
      requirements: ["Provide OpenAPI fragments, route files, or README notes"],
      availability: { status: "open" },
      metadata: { version: "v1" },
      pricing_details: { quote_basis: "endpoint count" },
      invocation_method: "email",
      contact_info: { email: "doc-dock@example.com" },
      sample_input: { repository: "https://github.com/acme/api" },
      sample_output: { endpoints_documented: 17, examples: 31 },
      required_capabilities: ["repo_read"],
    },
  },
  {
    privateKey: keys[3],
    sellerName: "OCR Pier",
    createdAt: 1777132980,
    payload: {
      category: "l402_api",
      title: "L402 OCR endpoint",
      summary: "Pay a small Lightning invoice, upload an image, receive structured OCR text.",
      description:
        "This API accepts PNG, JPEG, and PDF inputs after L402 payment. It returns extracted text blocks, bounding boxes, confidence scores, and a compact markdown rendering.",
      tags: ["ocr", "l402", "images"],
      pricing_model: "l402",
      pricing_details: { amount_sats: 120, unit: "per document" },
      invocation_method: "l402",
      invocation_url: "https://api.example.com/ocr",
      contact_info: { url: "https://api.example.com/ocr" },
      sample_input: { image_url: "https://files.example.com/receipt.png" },
      sample_output: { text_blocks: 18, markdown_url: "https://files.example.com/out.md" },
      required_capabilities: ["http", "lightning_wallet"],
    },
  },
  {
    privateKey: keys[4],
    sellerName: "Graph Harbormaster",
    createdAt: 1777133040,
    payload: {
      category: "l402_api",
      title: "Relationship graph extraction API",
      summary: "Converts unstructured text into graph nodes and edges behind an L402 gate.",
      description:
        "Post article text, meeting notes, or CRM snippets and receive typed entities, relationship edges, and provenance spans. Built for agents that need graph-ready extraction without a long-running account.",
      tags: ["graphs", "nlp", "l402"],
      pricing_model: "l402",
      pricing_details: { amount_sats: 250, unit: "per 25k characters" },
      invocation_method: "l402",
      invocation_url: "https://api.example.com/graph/extract",
      contact_info: { url: "https://api.example.com/graph/extract" },
      sample_input: { text: "Alice met Bob at the Atlanta BitDevs meetup." },
      sample_output: { nodes: 3, edges: 2 },
      required_capabilities: ["http", "lightning_wallet"],
    },
  },
  {
    privateKey: keys[5],
    sellerName: "Quote Buoy",
    createdAt: 1777133100,
    payload: {
      category: "l402_api",
      title: "Lightning quote and route probe API",
      summary: "Returns current Lightning payment route probes and fee estimates for agents.",
      description:
        "Agents can request route probes before committing to a downstream payment. The API is useful for budget checks, retry plans, and debugging Lightning payment failures.",
      tags: ["lightning", "routing", "l402"],
      pricing_model: "l402",
      pricing_details: { amount_sats: 75, unit: "per probe" },
      invocation_method: "l402",
      invocation_url: "https://api.example.com/lightning/probe",
      contact_info: { url: "https://api.example.com/lightning/probe" },
      sample_input: { destination: "alice@example.com", amount_sats: 1000 },
      sample_output: { estimated_fee_sats: 4, route_hints: 2 },
      required_capabilities: ["http", "lightning_wallet"],
    },
  },
  {
    privateKey: keys[6],
    sellerName: "Meetup Foundry",
    createdAt: 1777133160,
    payload: {
      category: "l402_workflow",
      title: "Meetup asset generator",
      summary: "Pay an L402 invoice, submit a meetup URL, receive event copy and assets.",
      description:
        "This workflow reads a meetup page and returns social copy, a speaker brief, venue notes, and a checklist for publication. It is built for local communities that need repeatable event operations.",
      tags: ["events", "marketing", "workflow"],
      pricing_model: "l402",
      pricing_details: { amount_sats: 600, unit: "per event" },
      invocation_method: "l402",
      invocation_url: "https://workflows.example.com/meetup-foundry",
      contact_info: { url: "https://workflows.example.com/meetup-foundry" },
      sample_input: { meetup_url: "https://example.com/events/bitcoin-101" },
      sample_output: { social_posts: 4, checklist_items: 18 },
      required_capabilities: ["http", "lightning_wallet", "web_fetch"],
    },
  },
  {
    privateKey: keys[7],
    sellerName: "Launch Ledger",
    createdAt: 1777133220,
    payload: {
      category: "l402_workflow",
      title: "Product launch checklist workflow",
      summary: "Turns a release note draft into launch tasks, owner assignments, and copy.",
      description:
        "Submit a product change summary after paying the workflow invoice. The workflow returns an implementation checklist, owner matrix, announcement drafts, and risk flags for launch review.",
      tags: ["launch", "workflow", "operations"],
      pricing_model: "l402",
      pricing_details: { amount_sats: 900, unit: "per launch packet" },
      invocation_method: "l402",
      invocation_url: "https://workflows.example.com/launch-ledger",
      contact_info: { url: "https://workflows.example.com/launch-ledger" },
      sample_input: { release_note: "Adds team billing and API usage limits." },
      sample_output: { tasks: 24, announcements: 3, risks: 5 },
      required_capabilities: ["http", "lightning_wallet"],
    },
  },
];

export function buildDemoData() {
  const sellers: Seller[] = [];
  const events: NostrEvent[] = [];
  const publicListings: ListingWithSeller[] = [];

  listings.forEach((entry, index) => {
    const pubkey = privateKeyToPubkey(entry.privateKey);
    const builtSeller = seller(pubkey, index + 1, entry.sellerName);
    const eventWithPubkey = buildEvent(entry.privateKey, pubkey, entry.createdAt, entry.sellerName, entry.payload);
    sellers.push(builtSeller);
    events.push(eventWithPubkey);
    publicListings.push(listingFromEvent(eventWithPubkey, builtSeller));
  });

  return { sellers, events, listings: publicListings };
}

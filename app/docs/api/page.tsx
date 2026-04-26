const endpoints = [
  ["GET", "/api/listings", "Browse active listings. Query: q, category, tag, seller, limit."],
  ["GET", "/api/listings/:id", "Fetch one listing by row id or event id."],
  ["GET", "/api/search?q=", "Search active listings with the same filter shape."],
  ["POST", "/api/sellers/register", "Create or update a pubkey-based seller profile."],
  ["POST", "/api/listing-fee/request", "Create a payment record or local development receipt."],
  ["POST", "/api/listings", "Publish a signed listing event. Production is L402-gated."],
  ["PATCH", "/api/listings/:id", "Update listing fields with a new seller-signed listing event."],
  ["POST", "/api/listings/:id/deactivate", "Deactivate a listing with an optional signed deactivation event."],
  ["POST", "/api/events/verify", "Verify event id and Schnorr signature."],
  ["POST", "/api/events/signing-template", "Low-level utility that returns a canonical payload template; the CLI is preferred for seller agents."],
  ["GET", "/api/events/:eventId", "Return a stored canonical event and ingest metadata."],
];

export default function ApiDocsPage() {
  return (
    <main className="container-shell flex-1 py-10">
      <article className="grid gap-8">
        <header className="page-header max-w-4xl">
          <p className="label page-kicker">API reference</p>
          <h1 className="display-type text-4xl font-bold md:text-5xl">HTTP-first marketplace API</h1>
          <p className="text-lg leading-8 text-[var(--muted)]">
            All endpoints return JSON. Errors use <code>{`{ "error": { "code", "message", "details" } }`}</code>.
          </p>
        </header>

        <section className="grid gap-3">
          {endpoints.map(([method, path, body]) => (
            <div key={`${method}-${path}`} className="card grid gap-3 p-4 md:grid-cols-[90px_260px_1fr]">
              <span className="label text-[var(--accent-dark)]">{method}</span>
              <code className="break-all font-mono text-sm font-bold">{path}</code>
              <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-black">Listing content schema</h2>
          <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
            {`{
  "category": "agent_service | l402_api | l402_workflow",
  "title": "Short listing title",
  "summary": "One-line buyer-facing summary",
  "description": "Detailed service/API/workflow description",
  "tags": ["github", "reviews"],
  "pricing_model": "free_contact | fixed_sats | fixed_usd | l402 | quote_required",
  "pricing_details": {},
  "invocation_method": "https | l402 | nostr_dm | email | webhook | manual_contact",
  "invocation_url": "https://example.com/endpoint",
  "contact_info": { "email": "seller@example.com" },
  "sample_input": {},
  "sample_output": {},
  "required_capabilities": ["http", "lightning_wallet"],
  "expires_at": null
}`}
          </pre>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-black">Nostr-shaped event</h2>
          <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
            {`{
  "id": "sha256 canonical event payload",
  "pubkey": "64 hex chars",
  "created_at": 1777132800,
  "kind": 33001,
  "tags": [["category", "agent_service"], ["t", "github"]],
  "content": "{...listing content JSON...}",
  "sig": "128 hex chars"
}`}
          </pre>
        </section>
      </article>
    </main>
  );
}

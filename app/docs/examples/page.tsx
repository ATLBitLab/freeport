export default function ExamplesPage() {
  return (
    <main className="container-shell flex-1 py-10">
      <article className="grid max-w-4xl gap-8">
        <header className="grid gap-3">
          <p className="label text-[var(--muted)]">Examples</p>
          <h1 className="text-4xl font-black md:text-5xl">Agent-ready request flows</h1>
        </header>

        <section className="grid gap-4">
          <h2 className="text-2xl font-black">Browse and search</h2>
          <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
            {`curl http://localhost:3000/api/listings
curl 'http://localhost:3000/api/search?q=ocr&category=l402_api'
curl http://localhost:3000/api/categories`}
          </pre>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-black">Generate and post with helper scripts</h2>
          <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
            {`pnpm freeport:keygen --out ./seller.key
pnpm freeport:post examples/listing.json --key ./seller.key --base http://localhost:3000`}
          </pre>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-black">Verify a stored event</h2>
          <pre className="card overflow-auto p-5 font-mono text-xs leading-6">
            {`curl http://localhost:3000/api/events/<event-id>
curl -X POST http://localhost:3000/api/events/verify \\
  -H 'content-type: application/json' \\
  --data @signed-event.json`}
          </pre>
        </section>
      </article>
    </main>
  );
}

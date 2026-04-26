import Link from "next/link";
import { ArrowRight } from "lucide-react";

const docs = [
  { href: "/docs/agents", title: "Agent guide", body: "Keys, wallet setup, browsing, listing, retries." },
  { href: "/docs/api", title: "API reference", body: "HTTP endpoints, schemas, examples, and error shapes." },
  { href: "/docs/examples", title: "Examples", body: "curl and helper-script flows for common agent tasks." },
];

export default function DocsPage() {
  return (
    <main className="container-shell flex-1 py-10">
      <div className="grid gap-8">
        <div className="page-header">
          <p className="label page-kicker">Docs</p>
          <h1 className="display-type text-4xl font-bold md:text-5xl">Freeport references</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {docs.map((doc) => (
            <Link key={doc.href} className="card grid gap-4 p-5" href={doc.href}>
              <h2 className="text-2xl font-black">{doc.title}</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">{doc.body}</p>
              <span className="button-ghost justify-self-start">
                Open
                <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

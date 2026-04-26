import { getCanonicalUrl } from "@/lib/env";

const allowedPaths = [
  "/",
  "/docs/",
  "/listings/",
  "/llms.txt",
  "/openapi.json",
  "/.well-known/api-catalog",
  "/.well-known/agent-skills/",
  "/api/categories",
  "/api/listings",
  "/api/search",
  "/api/sellers/",
  "/api/events/",
  "/api/health",
];

const disallowedPaths = [
  "/_next/",
  "/checkout/",
  "/api/mdk",
  "/api/listing-fee/",
  "/api/sellers/register",
  "/api/events/signing-template",
  "/api/events/verify",
  "/api/listings/*/deactivate",
];

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "Claude-Web",
  "Google-Extended",
  "Amazonbot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
];

const contentSignal = "Content-Signal: ai-train=no, search=yes, ai-input=yes";

function rulesFor(userAgent: string) {
  return [
    `User-agent: ${userAgent}`,
    ...allowedPaths.map((path) => `Allow: ${path}`),
    ...disallowedPaths.map((path) => `Disallow: ${path}`),
    contentSignal,
  ].join("\n");
}

export async function GET() {
  const body = [
    "# Freeport crawl policy",
    rulesFor("*"),
    ...aiCrawlers.map(rulesFor),
    `Sitemap: ${getCanonicalUrl("/sitemap.xml")}`,
    "",
  ].join("\n\n");

  return new Response(body, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

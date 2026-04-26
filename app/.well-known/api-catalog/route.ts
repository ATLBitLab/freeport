import { getCanonicalUrl } from "@/lib/env";

export const revalidate = 3600;

export async function GET() {
  const body = {
    linkset: [
      {
        anchor: getCanonicalUrl("/api"),
        "service-desc": [
          {
            href: getCanonicalUrl("/openapi.json"),
            type: "application/openapi+json",
          },
        ],
        "service-doc": [
          {
            href: getCanonicalUrl("/docs/api"),
            type: "text/html",
          },
          {
            href: getCanonicalUrl("/llms.txt"),
            type: "text/plain",
          },
        ],
        status: [
          {
            href: getCanonicalUrl("/api/health"),
            type: "application/json",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "application/linkset+json; charset=utf-8",
    },
  });
}

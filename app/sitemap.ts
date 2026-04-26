import type { MetadataRoute } from "next";

import { getCanonicalUrl } from "@/lib/env";
import { getRepository } from "@/lib/repository";

export const revalidate = 3600;

const staticRoutes = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/listings", changeFrequency: "hourly", priority: 0.9 },
  { path: "/sell", changeFrequency: "monthly", priority: 0.7 },
  { path: "/onboard", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/agents", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/api", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/examples", changeFrequency: "weekly", priority: 0.7 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const listings = await getRepository().listListings({ limit: 100 });

  return [
    ...staticRoutes.map((route) => ({
      url: getCanonicalUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...listings.map((listing) => ({
      url: getCanonicalUrl(`/listings/${listing.id}`),
      lastModified: new Date(listing.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}

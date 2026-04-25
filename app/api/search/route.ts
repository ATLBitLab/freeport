import { jsonResponse, parseLimit } from "@/lib/api";
import { listingToPublicJson } from "@/lib/event-mapping";
import { getRepository } from "@/lib/repository";
import { ListingCategorySchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = ListingCategorySchema.safeParse(url.searchParams.get("category"));
  const listings = await getRepository().listListings({
    q: url.searchParams.get("q") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    category: category.success ? category.data : undefined,
    limit: parseLimit(url.searchParams.get("limit")),
  });

  return jsonResponse({
    query: url.searchParams.get("q") ?? "",
    listings: listings.map(listingToPublicJson),
    count: listings.length,
  });
}

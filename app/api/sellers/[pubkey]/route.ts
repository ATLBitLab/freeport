import { errorResponse, jsonResponse } from "@/lib/api";
import { listingToPublicJson, sellerToPublicJson } from "@/lib/event-mapping";
import { getRepository } from "@/lib/repository";

export async function GET(_request: Request, context: { params: Promise<{ pubkey: string }> }) {
  const { pubkey } = await context.params;
  const repository = getRepository();
  const seller = await repository.getSellerByPubkey(pubkey);

  if (!seller) {
    return errorResponse({ code: "not_found", message: "Seller not found." }, 404);
  }

  const listings = await repository.listListings({ sellerPubkey: pubkey, limit: 100 });

  return jsonResponse({
    seller: sellerToPublicJson(seller, { includeTimestamps: true }),
    listings: listings.map(listingToPublicJson),
  });
}

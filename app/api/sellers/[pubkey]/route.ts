import { errorResponse, jsonResponse } from "@/lib/api";
import { listingToPublicJson } from "@/lib/event-mapping";
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
    seller: {
      id: seller.id,
      pubkey: seller.pubkey,
      display_name: seller.displayName,
      contact_method_type: seller.contactMethodType,
      contact_method_value: seller.contactMethodValue,
      wallet_type: seller.walletType,
      status: seller.status,
      created_at: seller.createdAt,
      updated_at: seller.updatedAt,
    },
    listings: listings.map(listingToPublicJson),
  });
}

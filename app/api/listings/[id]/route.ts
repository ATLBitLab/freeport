import { errorResponse, jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { listingToPublicJson } from "@/lib/event-mapping";
import { verifyNostrEvent } from "@/lib/nostr";
import { revalidateListingDiscovery } from "@/lib/revalidation";
import { getRepository } from "@/lib/repository";
import { ListingEventSchema, parseListingContent } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listing = await getRepository().getListing(id);

  if (!listing || !listing.active || listing.moderationStatus !== "active") {
    return errorResponse({ code: "not_found", message: "Listing not found." }, 404);
  }

  return jsonResponse({ listing: listingToPublicJson(listing) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repository = getRepository();
  const existing = await repository.getListing(id);

  if (!existing) {
    return errorResponse({ code: "not_found", message: "Listing not found." }, 404);
  }

  try {
    const body = await readJson(request);
    const event = ListingEventSchema.parse(body.event);
    const verification = verifyNostrEvent(event);

    if (!verification.ok) {
      return errorResponse({ code: verification.code, message: verification.message }, 422);
    }

    if (event.pubkey !== existing.seller?.pubkey) {
      return errorResponse(
        {
          code: "seller_signature_required",
          message: "Update event must be signed by the listing seller pubkey.",
        },
        403,
      );
    }

    parseListingContent(event.content);
    const updated = await repository.updateListing(existing.id, event);
    if (!updated) {
      return errorResponse({ code: "not_found", message: "Listing not found." }, 404);
    }
    revalidateListingDiscovery(updated.id);
    return jsonResponse({ listing: listingToPublicJson(updated) });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

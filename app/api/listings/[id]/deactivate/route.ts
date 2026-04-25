import { errorResponse, jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { EVENT_KINDS } from "@/lib/constants";
import { listingToPublicJson } from "@/lib/event-mapping";
import { verifyNostrEvent } from "@/lib/nostr";
import { getRepository } from "@/lib/repository";
import { ListingEventSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repository = getRepository();
  const listing = await repository.getListing(id);

  if (!listing) {
    return errorResponse({ code: "not_found", message: "Listing not found." }, 404);
  }

  try {
    const body = await readJson(request);
    const event = body.event ? ListingEventSchema.parse(body.event) : undefined;

    if (event) {
      const verification = verifyNostrEvent(event);
      if (!verification.ok) {
        return errorResponse({ code: verification.code, message: verification.message }, 422);
      }

      if (event.kind !== EVENT_KINDS.listingDeactivation) {
        return errorResponse(
          {
            code: "invalid_event_kind",
            message: `Deactivate events must use kind ${EVENT_KINDS.listingDeactivation}.`,
          },
          422,
        );
      }

      if (event.pubkey !== listing.seller?.pubkey) {
        return errorResponse(
          {
            code: "seller_signature_required",
            message: "Deactivate event must be signed by the listing seller pubkey.",
          },
          403,
        );
      }
    }

    const deactivated = await repository.deactivateListing(listing.id, event);
    if (!deactivated) {
      return errorResponse({ code: "not_found", message: "Listing not found." }, 404);
    }

    return jsonResponse({ listing: listingToPublicJson(deactivated) });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

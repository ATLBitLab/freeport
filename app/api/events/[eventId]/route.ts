import { errorResponse, jsonResponse } from "@/lib/api";
import { getRepository } from "@/lib/repository";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const record = await getRepository().getEvent(eventId);

  if (!record) {
    return errorResponse({ code: "not_found", message: "Event not found." }, 404);
  }

  return jsonResponse({
    event: JSON.parse(record.canonicalJson),
    metadata: {
      listing_id: record.listingId,
      valid_signature: record.validSignature,
      inserted_at: record.insertedAt,
      superseded_by_event_id: record.supersededByEventId,
    },
  });
}

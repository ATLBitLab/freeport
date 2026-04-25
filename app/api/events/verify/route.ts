import { jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { verifyNostrEvent } from "@/lib/nostr";
import { NostrEventSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const event = NostrEventSchema.parse(body.event ?? body);
    const verification = verifyNostrEvent(event);
    return jsonResponse({ valid: verification.ok, ...verification }, { status: verification.ok ? 200 : 422 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

import { errorResponse, jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { sellerToPublicJson } from "@/lib/event-mapping";
import { verifyNostrEvent } from "@/lib/nostr";
import { getRepository } from "@/lib/repository";
import { parseSellerProfileContent } from "@/lib/seller-profile";
import { SellerProfileRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = SellerProfileRequestSchema.parse(await readJson(request));
    const verification = verifyNostrEvent(parsed.event);

    if (!verification.ok) {
      return errorResponse(
        {
          code: verification.code,
          message: verification.message,
        },
        422,
      );
    }

    const profile = parseSellerProfileContent(parsed.event.content);
    const result = await getRepository().upsertSellerProfileFromEvent(parsed.event, profile);

    return jsonResponse({
      seller: sellerToPublicJson(result.seller, { includeTimestamps: true }),
      profile_updated: result.profileUpdated,
    });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

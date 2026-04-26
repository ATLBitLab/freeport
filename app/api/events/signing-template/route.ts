import { jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { makeSigningTemplate } from "@/lib/nostr";
import { assertListingSellerMatchesSigner, SigningTemplateRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = SigningTemplateRequestSchema.parse(await readJson(request));
    assertListingSellerMatchesSigner(body.content, body.pubkey);
    return jsonResponse({
      template: makeSigningTemplate({
        pubkey: body.pubkey,
        kind: body.kind,
        content: body.content,
        tags: body.tags,
      }),
    });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

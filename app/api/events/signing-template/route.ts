import { jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { makeSigningTemplate } from "@/lib/nostr";
import { SigningTemplateRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = SigningTemplateRequestSchema.parse(await readJson(request));
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

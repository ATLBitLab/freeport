import { jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { sellerToPublicJson } from "@/lib/event-mapping";
import { getRepository } from "@/lib/repository";
import { SellerRegisterSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = SellerRegisterSchema.parse(await readJson(request));
    const seller = await getRepository().upsertSeller({
      pubkey: body.pubkey,
      displayName: body.display_name,
      contactMethodType: body.contact_method_type,
      contactMethodValue: body.contact_method_value,
      walletType: body.wallet_type,
      walletMetadata: body.wallet_metadata,
    });
    return jsonResponse(
      {
        seller: sellerToPublicJson(seller),
      },
      { status: 201 },
    );
  } catch (error) {
    return validationErrorResponse(error);
  }
}

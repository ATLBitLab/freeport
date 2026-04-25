import { errorResponse, jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { ListingFeeConfirmSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = ListingFeeConfirmSchema.parse(await readJson(request));
    const payment = await getRepository().markPaymentPaid(body.payment_id, body.proof_payload ?? {});

    if (!payment) {
      return errorResponse({ code: "not_found", message: "Payment record not found." }, 404);
    }

    return jsonResponse({ payment });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

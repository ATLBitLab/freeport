import { errorResponse, jsonResponse, readJson, validationErrorResponse } from "@/lib/api";
import { LISTING_FEE_USD_CENTS } from "@/lib/constants";
import { hasMdkConfig, isProductionRuntime } from "@/lib/env";
import { getRepository } from "@/lib/repository";
import { ListingFeeRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = ListingFeeRequestSchema.parse(await readJson(request));
    const repository = getRepository();
    const seller =
      body.seller_id || !body.pubkey
        ? null
        : await repository.upsertSeller({
            pubkey: body.pubkey,
          });

    if (hasMdkConfig()) {
      const payment = await repository.createPayment({
        sellerId: body.seller_id ?? seller?.id ?? null,
        paymentStatus: "requested",
        proofPayload: {
          source: "mdk_l402",
          requested_for: body.listing_title ?? null,
        },
      });

      return jsonResponse({
        payment,
        fee: {
          model: "per_listing",
          amount_usd_cents: LISTING_FEE_USD_CENTS,
          currency: "USD",
        },
        next_step:
          "POST your signed listing event to /api/listings without Authorization to receive the MDK L402 invoice, pay it, then retry with Authorization: L402 <macaroon>:<preimage>.",
      });
    }

    if (isProductionRuntime()) {
      return errorResponse(
        {
          code: "payments_not_configured",
          message: "Money Dev Kit is not configured. Set MDK_ACCESS_TOKEN and MDK_MNEMONIC.",
        },
        503,
      );
    }

    const payment = await repository.createPayment({
      sellerId: body.seller_id ?? seller?.id ?? null,
      paymentStatus: "paid",
      proofPayload: {
        source: "local_development",
        note: "Development receipt. Production requires MDK L402 payment.",
      },
    });

    return jsonResponse({
      payment,
      fee: {
        model: "per_listing",
        amount_usd_cents: LISTING_FEE_USD_CENTS,
        currency: "USD",
      },
      dev_mode: true,
    });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

import { withPayment } from "@moneydevkit/nextjs/server";

import { errorResponse, jsonResponse, parseLimit, readJson, validationErrorResponse } from "@/lib/api";
import { LISTING_FEE_USD_CENTS } from "@/lib/constants";
import { hasMdkConfig } from "@/lib/env";
import { listingToPublicJson } from "@/lib/event-mapping";
import { verifyNostrEvent } from "@/lib/nostr";
import { revalidateListingDiscovery } from "@/lib/revalidation";
import { getRepository } from "@/lib/repository";
import type { ListingCategory, ListingFeePayment } from "@/lib/types";
import { CreateListingRequestSchema, ListingCategorySchema, parseListingContent } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category") ?? undefined;
  const parsedCategory = categoryParam ? ListingCategorySchema.safeParse(categoryParam) : null;

  if (categoryParam && parsedCategory && !parsedCategory.success) {
    return errorResponse(
      {
        code: "invalid_category",
        message: "category must be one of agent_service, l402_api, or l402_workflow.",
      },
      422,
    );
  }

  const listings = await getRepository().listListings({
    q: url.searchParams.get("q") ?? undefined,
    category: parsedCategory?.success ? (parsedCategory.data as ListingCategory) : undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    sellerPubkey: url.searchParams.get("seller") ?? undefined,
    limit: parseLimit(url.searchParams.get("limit")),
  });

  return jsonResponse({
    listings: listings.map(listingToPublicJson),
    count: listings.length,
    fee: {
      model: "per_listing",
      amount_usd_cents: LISTING_FEE_USD_CENTS,
      payment: hasMdkConfig() ? "l402_required_on_post" : "local_dev_receipt",
    },
  });
}

async function createListing(request: Request) {
  const repository = getRepository();

  try {
    const parsed = CreateListingRequestSchema.parse(await readJson(request));
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

    parseListingContent(parsed.event.content);

    let payment: ListingFeePayment | null = null;

    if (hasMdkConfig()) {
      payment = await repository.createPayment({
        paymentStatus: "paid",
        proofPayload: {
          source: "mdk_l402",
          authorization_present: Boolean(request.headers.get("authorization")),
        },
      });
    } else {
      if (!parsed.listing_fee_payment_id) {
        return errorResponse(
          {
            code: "listing_fee_required",
            message:
              "Request a local development listing-fee receipt at /api/listing-fee/request, then include listing_fee_payment_id.",
          },
          402,
        );
      }
      const existingPayment = await repository.getPayment(parsed.listing_fee_payment_id);
      if (!existingPayment || existingPayment.paymentStatus !== "paid") {
        return errorResponse(
          {
            code: "invalid_listing_fee_payment",
            message: "Listing fee payment was not found or is not paid.",
          },
          402,
        );
      }
      payment = existingPayment;
    }

    const listing = await repository.createListingFromEvent(parsed.event, payment);
    if (payment) await repository.consumePayment(payment.id, listing.id);
    revalidateListingDiscovery(listing.id);

    return jsonResponse({ listing: listingToPublicJson(listing) }, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}

export const POST = hasMdkConfig()
  ? withPayment(
      {
        amount: LISTING_FEE_USD_CENTS,
        currency: "USD",
        expirySeconds: 900,
      },
      createListing,
    )
  : createListing;

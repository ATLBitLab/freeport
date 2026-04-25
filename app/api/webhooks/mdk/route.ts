import { Webhook } from "standardwebhooks";

import { errorResponse, jsonResponse } from "@/lib/api";
import { getRepository } from "@/lib/repository";

export async function POST(request: Request) {
  const secret = process.env.MDK_WEBHOOK_SECRET;

  if (!secret) {
    return errorResponse(
      {
        code: "webhook_not_configured",
        message: "MDK_WEBHOOK_SECRET is not configured.",
      },
      503,
    );
  }

  const body = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
  };

  let payload: Record<string, unknown>;
  try {
    payload = new Webhook(secret).verify(body, headers) as Record<string, unknown>;
  } catch {
    return errorResponse({ code: "invalid_signature", message: "Invalid webhook signature." }, 401);
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const metadata = data?.metadata as Record<string, unknown> | undefined;
  const paymentId = metadata?.listing_fee_payment_id;

  if (payload.type === "checkout.completed" && typeof paymentId === "string") {
    await getRepository().markPaymentPaid(paymentId, {
      source: "mdk_webhook",
      event_id: payload.id,
      data: data ?? {},
    });
  }

  return jsonResponse({ received: true });
}

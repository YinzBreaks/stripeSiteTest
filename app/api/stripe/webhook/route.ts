import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe/webhooks";
import { createServiceClient } from "@/lib/supabase/server";
import type { ShippingAddress } from "@/lib/types";

// Stripe requires the raw body – disable Next.js body parsing
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session, supabase);
        break;
      }
      case "payment_intent.payment_failed": {
        // Do NOT revert here — the user can retry on the same Stripe Checkout page.
        // The card will revert via checkout.session.expired (triggered by our cancel
        // endpoint or Stripe's 30-min expiry) once the session is truly dead.
        break;
      }
      default:
        // Unhandled event type – acknowledge receipt
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceClient>
) {
  const cardId = session.metadata?.card_id;
  if (!cardId) {
    console.error("[webhook] checkout.session.completed missing card_id metadata");
    return;
  }

  const shipping = session.shipping_details;
  const shippingAddress: ShippingAddress | null =
    shipping?.address
      ? {
          line1: shipping.address.line1 ?? "",
          line2: shipping.address.line2 ?? null,
          city: shipping.address.city ?? "",
          state: shipping.address.state ?? "",
          postal_code: shipping.address.postal_code ?? "",
          country: shipping.address.country ?? "",
        }
      : null;

  // Insert order — unique constraint on stripe_session_id handles idempotency
  const { error: orderError } = await supabase.from("orders").insert({
    card_id: cardId,
    buyer_email: session.customer_details?.email ?? "",
    buyer_name: session.customer_details?.name ?? null,
    stripe_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    status: "paid",
    shipping_address: shippingAddress,
    amount_cents: session.amount_total ?? 0,
  });

  if (orderError) {
    // 23505 = unique_violation — this session was already processed on a prior delivery
    if ((orderError as { code?: string }).code === "23505") {
      console.log("[webhook] checkout.session.completed already processed, skipping:", session.id);
      return;
    }
    console.error("[webhook] Failed to insert order:", orderError);
    throw orderError;
  }

  // Mark card as sold
  const { error: cardError } = await supabase
    .from("cards")
    .update({ status: "sold" })
    .eq("id", cardId);

  if (cardError) {
    console.error("[webhook] Failed to mark card as sold:", cardError);
    throw cardError;
  }
}

async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceClient>
) {
  const cardId = session.metadata?.card_id;
  if (!cardId) return;

  // Only revert if still pending (idempotent)
  await supabase
    .from("cards")
    .update({ status: "for_sale" })
    .eq("id", cardId)
    .eq("status", "pending");
}

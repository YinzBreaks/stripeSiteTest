import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import type { Card, CheckoutRequestBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = (await req.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { cardId } = body;
  if (!cardId || typeof cardId !== "string") {
    return NextResponse.json({ error: "cardId is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch the card record – we NEVER trust client-sent price data
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .single<Card>();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (card.status !== "for_sale") {
    return NextResponse.json(
      { error: "This card is not available for purchase" },
      { status: 409 }
    );
  }

  if (!card.price_cents || card.price_cents <= 0) {
    return NextResponse.json(
      { error: "Card does not have a valid price" },
      { status: 422 }
    );
  }

  // Mark as pending immediately to prevent race-condition double purchases
  const { error: updateError } = await supabase
    .from("cards")
    .update({ status: "pending" })
    .eq("id", cardId)
    .eq("status", "for_sale"); // optimistic concurrency – only succeeds if still for_sale

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to reserve card" },
      { status: 500 }
    );
  }

  // Verify the update actually succeeded (another request may have won the race)
  const { data: reserved } = await supabase
    .from("cards")
    .select("status")
    .eq("id", cardId)
    .single<Pick<Card, "status">>();

  if (!reserved || reserved.status !== "pending") {
    return NextResponse.json(
      { error: "This card is no longer available" },
      { status: 409 }
    );
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: card.price_cents,
              product_data: {
                name: `${card.year} ${card.brand} ${card.player_name}`,
                description: [
                  card.set_name,
                  card.card_number ? `#${card.card_number}` : null,
                  card.variation,
                  card.grade,
                ]
                  .filter(Boolean)
                  .join(" · "),
                images: card.image_front_url ? [card.image_front_url] : [],
                metadata: { card_id: card.id },
              },
            },
            quantity: 1,
          },
        ],
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "AU"],
        },
        success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/api/stripe/cancel?session_id={CHECKOUT_SESSION_ID}&card_id=${card.id}`,
        metadata: { card_id: card.id },
        payment_intent_data: {
          // Propagate card_id so PaymentIntent events also carry it
          metadata: { card_id: card.id },
        },
      },
      {
        // Include timestamp so retried purchases after cancel get a fresh session
        idempotencyKey: `checkout-${card.id}-${Date.now()}`,
      }
    );

    if (!session.url) {
      throw new Error("Stripe did not return a session URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (stripeError) {
    // Revert status so the card becomes purchasable again
    await supabase
      .from("cards")
      .update({ status: "for_sale" })
      .eq("id", cardId);

    console.error("[checkout] Stripe session creation failed:", stripeError);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

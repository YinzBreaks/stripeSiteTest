import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * GET /api/stripe/cancel?session_id=cs_...&card_id=uuid
 *
 * Called when the user hits Back on the Stripe Checkout page.
 * Expires the session immediately (triggering checkout.session.expired webhook
 * which reverts the card to for_sale) then redirects back to the card page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  const cardId = searchParams.get("card_id");

  const redirectUrl = cardId
    ? `${env.NEXT_PUBLIC_SITE_URL}/shop/${cardId}?cancelled=true`
    : `${env.NEXT_PUBLIC_SITE_URL}/shop`;

  if (!sessionId || !cardId) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Expire the session — this fires checkout.session.expired webhook
    // which reverts the card status to for_sale
    await getStripe().checkout.sessions.expire(sessionId);
  } catch (err: unknown) {
    // Session may already be expired or completed — fall back to direct DB revert
    const msg = err instanceof Error ? err.message : String(err);
    const alreadyExpired =
      msg.includes("already expired") ||
      msg.includes("complete") ||
      msg.includes("No such checkout.session");

    if (!alreadyExpired) {
      console.error("[cancel] Failed to expire Stripe session:", err);
    }

    // Safe fallback: revert card directly (idempotent — only reverts if pending)
    const supabase = createServiceClient();
    await supabase
      .from("cards")
      .update({ status: "for_sale" })
      .eq("id", cardId)
      .eq("status", "pending");
  }

  return NextResponse.redirect(redirectUrl);
}

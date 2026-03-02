import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * @param body   Raw request body string (must NOT be parsed/buffered beforehand)
 * @param sig    Value of the `stripe-signature` HTTP header
 */
export function constructWebhookEvent(body: string, sig: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    body,
    sig,
    env.STRIPE_WEBHOOK_SECRET
  );
}

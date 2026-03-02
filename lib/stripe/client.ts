import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * Returns the lazily-initialized singleton Stripe server client.
 * Initialization is deferred until first use so that the module can be
 * imported without triggering env-var validation at build time.
 * NEVER use this in browser/client code – the secret key stays server-only.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

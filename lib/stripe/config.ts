// Server-side only - do not import this file in client components
import Stripe from "stripe";

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }

  return new Stripe(secretKey, {
    typescript: true,
  });
}

// Lazy initialization - only throws when actually used, not at build time
let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      _stripe = getStripeInstance();
    }
    return _stripe[prop as keyof Stripe];
  },
});

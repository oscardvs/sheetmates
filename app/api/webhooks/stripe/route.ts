import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // Dynamic import to avoid initializing Firebase on module load in API routes
      const { updateOrder } = await import("@/lib/firebase/db/orders");
      await updateOrder(orderId, {
        status: "paid",
        stripeSessionId: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}

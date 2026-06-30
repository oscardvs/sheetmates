import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { adminDb } from "@/lib/firebase/admin";
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

    if (orderId && session.payment_status === "paid") {
      const orderRef = adminDb().collection("orders").doc(orderId);
      const snap = await orderRef.get();

      if (snap.exists) {
        const order = snap.data() as { total: number; status: string };
        const expectedCents = Math.round(order.total * 100);

        // Defense in depth: confirm the customer actually paid what we charged.
        if (
          session.amount_total != null &&
          session.amount_total !== expectedCents
        ) {
          console.error(
            `Order ${orderId} amount mismatch: charged ${session.amount_total}, expected ${expectedCents}`
          );
        } else if (order.status === "pending") {
          await orderRef.update({
            status: "paid",
            stripeSessionId: session.id,
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";

interface CheckoutItem {
  name: string;
  quantity: number;
  priceInCents: number;
}

export async function POST(request: Request) {
  try {
    const { items, orderId } = (await request.json()) as {
      items: CheckoutItem[];
      orderId: string;
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.priceInCents,
        },
        quantity: item.quantity,
      })),
      metadata: { orderId },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

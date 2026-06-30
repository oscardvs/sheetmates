import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";

// Verifies a Checkout Session after the customer is redirected back, so the
// success page reflects the real payment state instead of trusting the URL.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      paid: session.payment_status === "paid",
      paymentStatus: session.payment_status,
      orderId: session.metadata?.orderId ?? null,
      amountTotal: session.amount_total,
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Could not verify session" },
      { status: 500 }
    );
  }
}

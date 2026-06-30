import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { calculatePartPrice } from "@/lib/pricing/engine";
import {
  defaultPricingConfig,
  type PricingConfig,
} from "@/lib/firebase/db/pricing-config";

interface CheckoutRequest {
  partIds: string[];
}

// Statuses that are still eligible to be purchased.
const PAYABLE_STATUSES = new Set(["pending", "nested"]);

export async function POST(request: Request) {
  try {
    // 1. Authenticate the caller from the Firebase ID token.
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid: string;
    let email: string | undefined;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { partIds } = (await request.json()) as CheckoutRequest;
    if (!Array.isArray(partIds) || partIds.length === 0) {
      return NextResponse.json({ error: "No parts to checkout" }, { status: 400 });
    }

    const db = adminDb();

    // 2. Load the parts and verify ownership + payable status server-side.
    const partSnaps = await db.getAll(
      ...partIds.map((id) => db.collection("parts").doc(id))
    );
    const parts = partSnaps
      .filter((snap) => snap.exists)
      .map((snap) => ({ id: snap.id, ...snap.data() }) as {
        id: string;
        userId: string;
        fileName: string;
        material: string;
        thickness: number;
        area: number;
        cutLength: number;
        quantity: number;
        status: string;
      });

    if (parts.length !== partIds.length) {
      return NextResponse.json({ error: "Some parts no longer exist" }, { status: 400 });
    }
    const invalid = parts.find(
      (p) => p.userId !== uid || !PAYABLE_STATUSES.has(p.status)
    );
    if (invalid) {
      return NextResponse.json(
        { error: "One or more parts cannot be purchased" },
        { status: 403 }
      );
    }

    // 3. Load the authoritative pricing config (never trust the client).
    const configSnap = await db.collection("pricingConfig").doc("default").get();
    const config = (
      configSnap.exists ? configSnap.data() : defaultPricingConfig
    ) as PricingConfig;

    // 4. Recompute every price on the server from stored geometry.
    const lineItems: {
      price_data: {
        currency: string;
        product_data: { name: string };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];
    const orderItems: {
      partId: string;
      fileName: string;
      quantity: number;
      pricePerUnit: number;
      total: number;
    }[] = [];

    let subtotalCents = 0;
    for (const part of parts) {
      const breakdown = calculatePartPrice(
        {
          areaMm2: part.area,
          cutLengthMm: part.cutLength,
          material: part.material,
          thickness: String(part.thickness),
          quantity: part.quantity,
        },
        config
      );
      const unitCents = Math.round(breakdown.pricePerUnit * 100);
      const lineCents = unitCents * part.quantity;
      subtotalCents += lineCents;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: part.fileName },
          unit_amount: unitCents,
        },
        quantity: part.quantity,
      });
      orderItems.push({
        partId: part.id,
        fileName: part.fileName,
        quantity: part.quantity,
        pricePerUnit: unitCents / 100,
        total: lineCents / 100,
      });
    }

    // VAT as a dedicated line so the customer is charged exactly the gross
    // total and the Stripe receipt itemizes tax.
    const vatCents = Math.round(subtotalCents * config.vatRate);
    const totalCents = subtotalCents + vatCents;
    if (vatCents > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: `VAT (${Math.round(config.vatRate * 100)}%)` },
          unit_amount: vatCents,
        },
        quantity: 1,
      });
    }

    // 5. Create the order server-side (client cannot write orders).
    const orderRef = await db.collection("orders").add({
      userId: uid,
      userEmail: email ?? null,
      items: orderItems,
      subtotal: subtotalCents / 100,
      vat: vatCents / 100,
      total: totalCents / 100,
      status: "pending",
      stripeSessionId: null,
      createdAt: new Date(),
    });

    // 6. Create the Stripe Checkout Session.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      metadata: { orderId: orderRef.id, uid },
      customer_email: email,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
    });

    await orderRef.update({ stripeSessionId: session.id });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

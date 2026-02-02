import { NextResponse } from "next/server";

interface ContactFormData {
  reason: string;
  name: string;
  email: string;
  orderReference?: string;
  message: string;
}

const REASON_LABELS: Record<string, string> = {
  general: "General Inquiry",
  quote: "Quote Request",
  orderSupport: "Order Support",
  technical: "Technical Issue",
  other: "Other",
};

export async function POST(request: Request) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message || !data.reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL || "contact@sheetmates.com";

    if (!resendApiKey) {
      // Log the contact form submission for now
      console.log("=== Contact Form Submission ===");
      console.log("Reason:", REASON_LABELS[data.reason] || data.reason);
      console.log("Name:", data.name);
      console.log("Email:", data.email);
      if (data.orderReference) {
        console.log("Order Reference:", data.orderReference);
      }
      console.log("Message:", data.message);
      console.log("==============================");

      // Return success even without email sending (for development)
      return NextResponse.json({ success: true });
    }

    // Send email via Resend
    const reasonLabel = REASON_LABELS[data.reason] || data.reason;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SheetMates <noreply@sheetmates.com>",
        to: [contactEmail],
        reply_to: data.email,
        subject: `[SheetMates] ${reasonLabel}: ${data.name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Reason:</strong> ${reasonLabel}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.orderReference ? `<p><strong>Order Reference:</strong> ${data.orderReference}</p>` : ""}
          <hr />
          <h3>Message:</h3>
          <p>${data.message.replace(/\n/g, "<br />")}</p>
        `,
        text: `
New Contact Form Submission

Reason: ${reasonLabel}
Name: ${data.name}
Email: ${data.email}
${data.orderReference ? `Order Reference: ${data.orderReference}` : ""}

Message:
${data.message}
        `.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

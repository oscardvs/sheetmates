# Platform Enhancements Design

**Date**: 2026-02-02
**Status**: Approved
**Scope**: Contact form, FAQ page, legal pages, cookie consent, custom email setup

---

## Overview

Enhance the SheetMates platform with customer communication, help content, and legal compliance features required for a live e-commerce site.

---

## 1. Contact Form

### Route
`/contact` → `app/[locale]/contact/page.tsx`

### Form Fields

| Field | Type | Required | Condition |
|-------|------|----------|-----------|
| Reason for contact | Select | Yes | Always shown |
| Name | Text input | Yes | Always shown |
| Email | Email input | Yes | Always shown |
| Order reference | Text input | No | Shown when reason = "Order Support" |
| Message | Textarea | Yes | Always shown |
| File attachment | File input | No | Shown when reason = "Quote Request" |

### Reason Options
- General Inquiry
- Quote Request
- Order Support
- Technical Issue
- Other

### File Attachment
- Accepted formats: `.dxf`, `.pdf`, `.png`, `.jpg`
- Max size: 10MB
- Uploaded to temporary storage or sent as email attachment

### Submission Flow
1. Client-side validation (required fields, email format)
2. POST to `/api/contact`
3. API route sends formatted email via Resend
4. Success: Show toast, reset form
5. Error: Show error toast with retry option

### API Endpoint
`app/api/contact/route.ts`

```typescript
// POST /api/contact
interface ContactFormData {
  reason: string;
  name: string;
  email: string;
  orderReference?: string;
  message: string;
  attachment?: File;
}
```

### Email Delivery
- **Service**: Resend (free tier: 3,000 emails/month)
- **To**: contact@sheetmates.com
- **Subject**: `[SheetMates] {reason}: {name}`
- **Reply-To**: Sender's email

---

## 2. FAQ Page

### Route
`/faq` → `app/[locale]/faq/page.tsx`

### Structure
Single page with accordion sections grouped by category.

### Categories & Questions

#### Getting Started
- What is SheetMates?
- How does it work?
- Do I need an account to get started?
- What file formats do you accept?

#### Pricing
- How is pricing calculated?
- Are there minimum order fees?
- What's included in the price?
- How does the community sheet model work?

#### Materials & Capabilities
- What materials can you cut?
- What thicknesses are available?
- What's the maximum part size?
- What precision can I expect?

#### DXF Best Practices
- How do I export a DXF from my CAD software?
- What export settings should I use?
- Common mistakes to avoid
- Do I need to account for kerf?

#### Delivery & Lead Times
- How long until my parts ship?
- What's the viability threshold?
- Can I expedite my order (Bus Driver)?
- Where do you ship?

#### Orders & Support
- How do I track my order?
- Can I cancel or modify an order?
- What if something is wrong with my parts?

### Component
Uses Shadcn `Accordion` component with `AccordionItem`, `AccordionTrigger`, `AccordionContent`.

### i18n
All content stored in `messages/{locale}.json` under `faq` namespace:

```json
{
  "faq": {
    "title": "Frequently Asked Questions",
    "categories": {
      "gettingStarted": {
        "title": "Getting Started",
        "items": [
          {
            "question": "What is SheetMates?",
            "answer": "SheetMates is a community-driven..."
          }
        ]
      }
    }
  }
}
```

---

## 3. Legal Pages

### Privacy Policy

**Route**: `/privacy` → `app/[locale]/privacy/page.tsx`

**Content Sections**:
1. Introduction & Data Controller (SheetMates, Belgian company)
2. Data We Collect
   - Account data (email, name)
   - Order data (shipping address, order history)
   - Technical data (IP address, browser info)
3. How We Use Your Data
   - Process orders
   - Send order updates
   - Improve our service
4. Data Processors
   - Firebase (authentication, database) - Google Ireland
   - Stripe (payments) - Stripe Ireland
5. Data Storage & Security
   - All data hosted in EU (europe-west1)
   - Encryption in transit and at rest
6. Your GDPR Rights
   - Access, rectification, erasure, portability
   - Right to object, restrict processing
   - How to exercise rights (contact email)
7. Data Retention
   - Account data: Until deletion requested
   - Order data: 7 years (legal requirement)
   - Guest sessions: Auto-deleted after 24 hours
8. Contact Information

### Terms & Conditions

**Route**: `/terms` → `app/[locale]/terms/page.tsx`

**Content Sections**:
1. Introduction & Acceptance
2. Service Description
   - Laser cutting marketplace
   - Community sheet aggregation
3. Account Registration
4. Orders & Payments
   - Pricing transparency
   - Payment processing (Stripe)
   - Order confirmation
5. Production & Delivery
   - Viability threshold
   - Lead times
   - Shipping
6. Quality & Returns
   - DFM checks are guidance, not guarantee
   - Defect policy
7. User Obligations
   - Accurate file uploads
   - Legal use only
8. Intellectual Property
   - User retains IP of designs
   - SheetMates IP (branding, software)
9. Limitation of Liability
10. Governing Law (Belgian law, Brussels courts)
11. Changes to Terms
12. Contact Information

### Cookie Policy

**Route**: `/cookies` → `app/[locale]/cookies/page.tsx`

**Content Sections**:
1. What Are Cookies
2. Cookies We Use

| Cookie | Purpose | Type | Duration |
|--------|---------|------|----------|
| `firebase-auth` | Authentication session | Essential | Session |
| `__stripe_mid` | Stripe fraud prevention | Essential | 1 year |
| `__stripe_sid` | Stripe fraud prevention | Essential | 30 min |
| `cookie-consent` | Remember consent choice | Essential | 1 year |

3. No Tracking Cookies
   - We do not use analytics or advertising cookies
4. Managing Cookies
   - Browser settings instructions
5. Contact Information

---

## 4. Cookie Consent Banner

### Component
`components/cookie-consent.tsx`

### Design
- **Position**: Fixed bottom, full width
- **Background**: `zinc-900` with subtle top border (`zinc-800`)
- **Layout**: Flex row, text left, buttons right
- **Text**: "We use essential cookies for site functionality and secure payments."
- **Buttons**:
  - "Accept" (primary button, `emerald-600`)
  - "Learn more" (ghost button, links to `/cookies`)

### Behavior
1. On mount, check `localStorage.getItem('cookie-consent')`
2. If not set, show banner
3. "Accept" click: `localStorage.setItem('cookie-consent', 'accepted')`, hide banner
4. Banner never shows again after acceptance

### Placement
Rendered in `app/[locale]/layout.tsx` as last child (above all content via fixed positioning).

---

## 5. Footer Updates

### Current Footer Links
- Pricing
- Home (implicit via logo)

### New Footer Structure

```
SheetMates                          Help                    Legal
© 2026 SheetMates.                  FAQ                     Privacy Policy
All rights reserved.               Contact                  Terms & Conditions
                                                            Cookie Policy
```

### Implementation
Update `components/footer.tsx` to include three columns:
1. Brand + copyright
2. Help links (FAQ, Contact)
3. Legal links (Privacy, Terms, Cookies)

---

## 6. Custom Email Setup (Cloudflare)

### Goal
`contact@sheetmates.com` forwards to personal inbox with ability to reply as that address.

### Prerequisites
- Domain: sheetmates.com (currently at Namecheap)
- Cloudflare account (free tier)

### Step-by-Step Instructions

#### Step 1: Add Domain to Cloudflare
1. Sign up at cloudflare.com (free plan)
2. Click "Add a Site"
3. Enter: `sheetmates.com`
4. Select Free plan
5. Cloudflare scans and imports existing DNS records
6. Review records, ensure website records are correct
7. Note the assigned nameservers (e.g., `ada.ns.cloudflare.com`)

#### Step 2: Update Namecheap Nameservers
1. Log into Namecheap
2. Go to Domain List → sheetmates.com → Manage
3. Find "Nameservers" section
4. Change from "Namecheap BasicDNS" to "Custom DNS"
5. Enter Cloudflare nameservers:
   - `ada.ns.cloudflare.com` (example)
   - `bob.ns.cloudflare.com` (example)
6. Save changes
7. Wait for propagation (usually 10-30 minutes, up to 48 hours)

#### Step 3: Configure Email Routing
1. In Cloudflare Dashboard, select sheetmates.com
2. Go to Email → Email Routing
3. Click "Get Started" or "Enable Email Routing"
4. Add destination address:
   - Enter your personal email
   - Click verification link sent to that email
5. Create routing rule:
   - Custom address: `contact`
   - Action: Forward to → your verified email
6. Cloudflare automatically adds required MX and TXT records

#### Step 4: Set Up "Send As" in Gmail (Optional)
1. In Gmail, go to Settings (gear icon) → See all settings
2. Go to "Accounts and Import" tab
3. Find "Send mail as" → Click "Add another email address"
4. Enter:
   - Name: SheetMates
   - Email: contact@sheetmates.com
5. Uncheck "Treat as an alias"
6. Click Next
7. For SMTP server, choose "Send through Gmail"
8. Verify via email link
9. When composing, select "From: contact@sheetmates.com"

### Verification Checklist
- [ ] Domain shows "Active" in Cloudflare
- [ ] Email routing shows green checkmarks
- [ ] Test email to contact@sheetmates.com arrives
- [ ] Reply "as" contact@sheetmates.com works (if Gmail configured)

---

## 7. File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `app/[locale]/contact/page.tsx` | Contact form page |
| `app/[locale]/faq/page.tsx` | FAQ page with accordions |
| `app/[locale]/privacy/page.tsx` | Privacy policy |
| `app/[locale]/terms/page.tsx` | Terms & conditions |
| `app/[locale]/cookies/page.tsx` | Cookie policy |
| `app/api/contact/route.ts` | Contact form API endpoint |
| `components/cookie-consent.tsx` | Cookie consent banner |

### Modified Files

| File | Changes |
|------|---------|
| `components/footer.tsx` | Restructure with Help + Legal sections |
| `messages/en.json` | Add `contact`, `faq`, `legal`, `cookieConsent` namespaces |
| `messages/fr.json` | French translations |
| `messages/cs.json` | Czech translations |
| `app/[locale]/layout.tsx` | Add CookieConsent component |
| `package.json` | Add `resend` dependency |

### Dependencies

```bash
npm install resend
```

---

## 8. Environment Variables

Add to `.env.local`:

```bash
# Resend (for contact form emails)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Contact email recipient
CONTACT_EMAIL=contact@sheetmates.com
```

---

## 9. Out of Scope

- Admin dashboard for contact form submissions
- Analytics/tracking cookies
- Newsletter signup
- Live chat widget
- Multi-file upload on contact form

---

## 10. Implementation Order

1. **Email Setup** (manual, no code) — Do first so contact form has destination
2. **Cookie Consent Banner** — Simple component, quick win
3. **Legal Pages** — Static content, can be refined later
4. **Footer Updates** — Add all new links
5. **FAQ Page** — Translations + accordion component
6. **Contact Form** — Page + API route + Resend integration

---

## Legal Disclaimer

The legal document templates (Privacy Policy, Terms & Conditions, Cookie Policy) provided in this implementation are starting points based on common e-commerce requirements and GDPR principles. They are NOT legal advice. Before relying on these documents:

1. Have them reviewed by a qualified Belgian/EU lawyer
2. Ensure they accurately reflect your actual data practices
3. Update them as your practices change
4. Consider your specific business circumstances

SheetMates operates under Belgian law with EU customers — professional legal review is strongly recommended.

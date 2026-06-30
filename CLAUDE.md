# SheetMates - Project Memory

## What Is This?

SheetMates is a Belgian-incorporated digital platform that transforms Tech-Centrum's (TC) virgin buffer sheets into a community-driven fabrication marketplace. When industrial clients order hundreds of parts, TC procures extra "buffer" material. These untouched 3000x1500mm sheets become stagnant capital. SheetMates lists them for community aggregation, offering price-performance that brokers like Fractory or Xometry cannot match.

**Core Value Proposition**: Arbitrage industrial sunk costs (pre-paid logistics + material overhead) to serve makers, engineers, and hardware startups at industrial precision and accessible prices.

## Tech Stack

```
Frontend:     Next.js 16 + React 19 + TypeScript (strict mode)
Styling:      Tailwind CSS v4 + Shadcn UI (customized, source-owned)
State:        Zustand (canvas) + TanStack Query (server state)
Canvas:       Konva.js / react-konva (playground); SVG SheetViewer (read-only views)
i18n:         next-intl (en, fr, cs)
Backend:      Firebase (Auth, Firestore, Storage) - europe-west1 region
Server auth:  Firebase Admin SDK (checkout, Stripe webhook, Cloud Functions)
Payments:     Stripe Checkout (Payment mode, EU VAT itemized as a line)
Nesting:      Custom shelf-packer (FFDH); WASM libnest2d path scaffolded [not built]
```

## Architecture Overview

```
app/
├── [locale]/                    # i18n routing
│   ├── (protected)/             # Auth-required routes
│   │   ├── (admin)/             # Factory operator dashboard
│   │   ├── upload/              # DXF upload flow
│   │   ├── sheets/              # Browse/view live sheets
│   │   ├── checkout/            # Stripe payment flow
│   │   └── queue/               # Production queue status
│   ├── login/signup/            # Auth pages
│   └── page.tsx                 # Landing page
├── api/
│   ├── checkout/                # Server-side price recompute + order + Stripe session
│   ├── checkout/session/        # Verify a session after redirect (success page)
│   └── webhooks/stripe/         # Handle Stripe events (Admin SDK writes orders)
functions/                       # Cloud Functions: grantAdmin, TTL cleanup jobs
components/
├── ui/                          # Shadcn primitives (owned, customizable)
├── providers/                   # Context providers (auth)
├── dxf-uploader.tsx             # File upload + parsing
├── sheet-viewer.tsx             # SVG canvas for nesting viz
├── nesting-controls.tsx         # Material/kerf/sheet config
└── price-breakdown.tsx          # Cost transparency display
lib/
├── dxf/                         # DXF parsing, SVG conversion, area/cut calc
├── firebase/                    # Auth, Firestore collections, Storage
├── nesting/                     # Shelf-packing algorithm
├── pricing/                     # Cost calculation engine
└── stripe/                      # Client + server config
```

## Data Model (Firestore)

### Collections

```typescript
// sheets - Live sheets available for community nesting
{
  id: string;
  width: number;              // mm (standard: 3000)
  height: number;             // mm (standard: 1500)
  material: "steel" | "stainless" | "aluminum" | "copper";
  thickness: number;          // mm
  placements: SheetPlacement[];
  utilization: number;        // 0-1
  status: "open" | "full" | "cutting" | "done";
  // Dutch Auction fields (planned)
  initialPrice?: number;
  floorPrice?: number;
  auctionStart?: Timestamp;
  currentLockHolder?: string; // userId during checkout
  lockExpiry?: Timestamp;
}

// users
{
  uid: string;
  email: string;
  displayName?: string;
  nestingScore?: number;      // Gamification metric
}

// orders
{
  id: string;
  userId: string;
  sheetId: string;
  parts: OrderPart[];
  totalPrice: number;
  stripePaymentIntentId: string;
  status: "pending" | "paid" | "cutting" | "shipped" | "delivered";
}

// parts - Uploaded customer geometry
{
  id: string;
  userId: string;
  fileName: string;
  material: string;           // drives pricing multiplier (set at upload)
  thickness: number;          // mm; drives pricing multiplier (set at upload)
  boundingBox: { width: number; height: number };
  svgPath: string;
  area: number;               // mm² (authoritative input for pricing)
  cutLength: number;          // mm (authoritative input for pricing)
  quantity: number;
  status: "pending" | "nested" | "cut" | "shipped";
  sheetId: string | null;
  position: { x: number; y: number; rotation: number } | null;
}

// pricingConfig (singleton: "default")
{
  perCm2Rate: number;
  perMmCutRate: number;
  materialMultipliers: Record<string, number>;
  thicknessMultipliers: Record<string, number>;
  vatRate: number;            // 0.21 for Belgium
  // ... bulk discounts, minimums
}
```

> **Pricing is server-authoritative.** `POST /api/checkout` recomputes every
> price from the part's stored `area`/`cutLength`/`material`/`thickness` against
> `pricingConfig` (never trusting client-sent amounts), creates the `orders`
> document via the Admin SDK, and itemizes VAT as its own Stripe line so the
> amount charged equals the displayed gross total. The Stripe webhook (also
> Admin SDK) marks the order `paid` only after confirming `amount_total` matches.

## Design Philosophy: "Robot-Human" Centricity

The interface is a **translation layer** between CNC machines (deterministic, coordinate-based) and human designers (heuristic, creative).

### Visual Language

| Element | Specification |
|---------|---------------|
| Typography | Monospaced (Geist Mono) for data precision |
| Corners | Sharp, machined edges (`--radius: 0`) |
| Colors | Zinc-based palette (zinc-950 to zinc-100) |
| Feedback | Mechanical—snaps, clicks, lock-in visuals |
| Numbers | Never rounded in display; show full precision |

### Canvas Aesthetic (Nesting Playground)

```
Background:     zinc-950 (#09090b)
Grid Lines:     zinc-800 (1px @ 10mm, 2px @ 100mm)
Sheet Boundary: slate-700 at 50% opacity
Valid Parts:    emerald-500 stroke, 20% fill
Invalid Parts:  rose-500, pulsing animation
Snap Guides:    cyan-400, dashed
Labels:         JetBrains Mono, white
```

## Coding Conventions

### TypeScript

- **Strict mode** enabled; no `any` escapes
- Prefer `interface` for object shapes, `type` for unions/intersections
- Export types alongside implementations
- Use `satisfies` for type-safe object literals

```typescript
// Good
export interface PartPriceInput {
  areaMm2: number;
  cutLengthMm: number;
  material: string;
  thickness: string;
  quantity: number;
}

// Avoid
export type PartPriceInput = {
  areaMm2: any;  // Never
}
```

### React Components

- **Function components only** with explicit return types when complex
- Use `"use client"` directive only when needed (interactivity, hooks)
- Props interfaces named `{ComponentName}Props`
- Destructure props in function signature

```typescript
interface SheetViewerProps {
  sheetWidth: number;
  sheetHeight: number;
  placements: NestingPlacement[];
}

export function SheetViewer({ sheetWidth, sheetHeight, placements }: SheetViewerProps) {
  // ...
}
```

### File Organization

- One component per file (exceptions: tightly coupled sub-components)
- Co-locate types with implementation in `lib/` modules
- Shadcn UI components live in `components/ui/` and are fully customizable

### Imports

- Use `@/` path alias for all internal imports
- Group: React → external libs → internal `@/` imports → relative imports
- Prefer named exports (except page components which use default)

### State Management

- **Local state**: `useState` for simple UI state
- **Canvas state**: Zustand for high-frequency updates (60fps drag operations)
- **Server state**: TanStack Query for Firestore sync, caching, optimistic updates
- **Auth state**: React Context via `AuthProvider`

### Styling

- Tailwind utility classes; no inline styles
- Use `cn()` helper for conditional classes
- Shadcn component variants via `cva()` (class-variance-authority)
- CSS variables for theming (`--primary`, `--background`, etc.)

## DFM Constraints (Tech-Centrum Machines)

These constraints must be enforced in the browser before nesting:

### Trumpf TruLaser 3030 Fiber

| Parameter | Constraint |
|-----------|------------|
| Max sheet size | 3000 x 1500 mm |
| Material thickness | 0.5mm - 20mm (steel), 0.5mm - 25mm (aluminum) |
| Minimum hole diameter | ≥ material thickness |
| Minimum wall thickness | ≥ material thickness |
| Kerf width | ~0.1mm (fiber), varies by material/thickness |

### DFM Checks (Client-Side)

```typescript
// Implement in lib/dxf/dfm-checks.ts
interface DfmIssue {
  type: "hole_too_small" | "wall_too_thin" | "aspect_ratio" | "open_loop";
  severity: "error" | "warning";
  message: string;
  location?: { x: number; y: number };
}

function checkDfm(parsed: ParsedDxf, thickness: number): DfmIssue[];
```

### Heat Warp Risk

Flag geometry where `length / width > 10` and `width < thickness * 2`. Display as pulsing orange highlight with tooltip: `WARNING: HEAT_WARP_RISK`.

## Pricing Model

### Current: Cost-Plus

```
Price = (AreaCost + CutCost) × MaterialMult × ThicknessMult × ComplexityMult
      - BulkDiscount
      + VAT (21%)
```

### Planned: Dutch Auction (Yield-Sensitive)

```
Price(t) = FloorPrice + (InitialPrice - FloorPrice) × e^(-λt)

Where:
- λ = decay rate (dynamic based on inventory levels)
- t = time since auction start
```

**Viability Threshold**: Sheet runs when utilization ≥ 85% OR a user pays "Bus Driver" premium to force immediate production.

## Git Conventions

### Branch Naming

```
feature/SM-{ticket}-short-description
bugfix/SM-{ticket}-short-description
chore/SM-{ticket}-short-description
```

### Commit Messages

```
type(scope): short description

[optional body explaining why, not what]

Co-Authored-By: Claude <noreply@anthropic.com>  # if AI-assisted
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

Scopes: `canvas`, `nesting`, `pricing`, `auth`, `checkout`, `admin`, `i18n`

### Pull Request Guidelines

1. **Title**: Same format as commit message
2. **Description**: Include:
   - Summary (1-3 bullets)
   - Test plan (how to verify)
   - Screenshots/recordings for UI changes
3. **Size**: Keep PRs < 400 lines when possible
4. **Reviews**: Require 1 approval before merge

## Testing Strategy

### Unit Tests (Vitest)

Required for:
- `lib/dxf/*` - Parsing, area/cut calculation
- `lib/nesting/*` - Packing algorithms
- `lib/pricing/*` - Cost calculations

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
```

### E2E Tests (Playwright)

Required for:
- Upload → Nest → Checkout flow
- Auth flows (login, signup, protected routes)
- Admin injection workflow

### Canvas Testing

Use Playwright's visual regression for nesting canvas screenshots.

## Security Considerations

### Firestore Rules

- Price writes validated server-side (never trust client-calculated prices)
- Guest sessions can only write to `guest_drafts` collection
- Sheet locks have TTL; Cloud Function releases stale locks
- No direct write access to `orders` from client (use Cloud Functions)

### Sensitive Files

Never commit:
- `.env.local` (Firebase keys, Stripe keys)
- `serviceAccountKey.json`
- Any file matching `*.secret.*`

### GDPR Compliance

- All data hosted in `europe-west1` (Belgium)
- Guest sessions auto-deleted after 24 hours
- "Delete My Data" triggers recursive deletion of all user documents

## Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Firebase Admin SDK (server only; base64 service-account JSON).
# Optional on Firebase Hosting / Cloud Run (uses Application Default Credentials).
FIREBASE_SERVICE_ACCOUNT=
```

See `.env.example` for the canonical list. Copy it to `.env.local`.

## Current Limitations / Tech Debt

> Status as of the customer-readiness audit — see `docs/STATUS.md` for the full
> picture and the path to first customers.

1. **Nesting**: Shelf-packing (FFDH) only; no true-shape NFP. WASM `libnest2d`
   path is scaffolded in `wasm/` but **not built** (silently falls back).
2. **Production export**: `lib/export/dxf-writer.ts` emits bounding boxes, not
   real part outlines — **not yet usable for the laser** (top fulfillment gap).
3. **Dutch Auction**: Implemented + tested in `lib/pricing/auction.ts` but **not
   wired** into checkout (static cost-plus pricing is live).
4. **Sheet locks**: `lib/firebase/db/sheet-locks.ts` exists and an hourly Cloud
   Function reaps stale locks, but the lock is **not yet acquired** during checkout.
5. **Guest Flow**: No anonymous session persistence yet (cleanup job is ready).

### Resolved (previously listed as debt)

- ✅ State management: Zustand + TanStack Query in use.
- ✅ Canvas: Konva.js playground live (SVG retained for read-only views).
- ✅ Real-time: Firestore `onSnapshot` subscriptions added.
- ✅ Tests: Vitest suite (155 tests across dxf/nesting/pricing/canvas) passing.
- ✅ Orders: created/updated server-side via Admin SDK (not client-trusted).

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check

# Test
npm run test             # Vitest unit suite
npm run test:e2e         # Playwright

# Firebase
npx firebase emulators:start   # Local emulators
npx firebase deploy            # Deploy hosting + rules + functions
firebase deploy --only functions

# Admin provisioning (first admin, run once with a service account)
cd functions && npm run set-admin -- you@example.com

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Key Files for New Features

| Feature | Start Here |
|---------|------------|
| Add material type | `lib/firebase/db/pricing-config.ts`, `components/nesting-controls.tsx` |
| Modify nesting | `lib/nesting/shelf-packer.ts`, `lib/nesting/types.ts` |
| Add DFM check | `lib/dxf/` (create `dfm-checks.ts`) |
| New Firestore collection | `lib/firebase/db/` |
| New protected route | `app/[locale]/(protected)/` |
| Add translation | `messages/{locale}.json` |
| Change pricing/checkout | `app/api/checkout/route.ts`, `lib/pricing/engine.ts` |
| Add a Cloud Function | `functions/src/index.ts` |
| Server-side Firestore/Auth | `lib/firebase/admin.ts` |

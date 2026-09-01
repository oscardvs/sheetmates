# SheetMates

SheetMates is a sheet-metal fabrication marketplace based in Belgium, live at
https://sheetmates.com. Tech-Centrum's unused **buffer sheets** (3000×1500 mm
virgin sheets procured on top of industrial orders) are listed on the site.
You upload a DXF, it is nested onto an open sheet next to other people's parts,
and you pay for your share of the sheet.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict)
- **Styling:** Tailwind CSS v4 · Shadcn UI (source-owned) · monospaced "robot-human" aesthetic
- **State:** Zustand (canvas) · TanStack Query (server state)
- **Canvas:** Konva.js / react-konva for the nesting playground
- **i18n:** next-intl (en, fr, cs; all three complete)
- **Backend:** Firebase (Auth, Firestore, Storage), region `europe-west1`
- **Server auth:** Firebase Admin SDK (checkout + webhook + Cloud Functions)
- **Payments:** Stripe Checkout (EU VAT itemized)
- **Nesting:** custom shelf-packer (FFDH); a WASM `libnest2d` path under `wasm/` is scaffolded but not built yet

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Firebase + Stripe keys:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (safe to expose) |
| `NEXT_PUBLIC_APP_URL` | Base URL used for Stripe redirect URLs |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhooks |
| `FIREBASE_SERVICE_ACCOUNT` | Base64 service-account JSON for the Admin SDK (server). On Firebase Hosting / Cloud Run this is optional; Application Default Credentials are used automatically. |

### 3. Run

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build (requires Firebase env vars)
npm run lint
npm run test         # Vitest unit suite (lib/dxf, lib/nesting, lib/pricing, lib/canvas)
npm run test:e2e     # Playwright
```

### 4. Forward Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Provisioning the first admin

Admin access is gated by `users/{uid}.role == "admin"` (Firestore rules) and the
`admin` custom claim (Cloud Functions / API). Bootstrap your first admin once:

```bash
cd functions
npm install
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json npm run set-admin -- you@example.com
```

After the first admin exists, promote others from within the app via the
`grantAdmin` callable. Users must sign out/in to refresh their token.

## Cloud Functions

Located in [`functions/`](./functions) (Node 20, `europe-west1`):

- `grantAdmin`: callable; an admin promotes another user.
- `cleanupExpiredLocks`: hourly; releases stale sheet checkout locks.
- `cleanupGuestDrafts`: every 6h; deletes guest drafts older than 24h (GDPR).

```bash
firebase deploy --only functions
```

## Deployment

```bash
firebase deploy                 # hosting (Next.js SSR) + rules + functions
firebase deploy --only hosting
firebase deploy --only firestore:rules,storage
```

## Project Layout

See [`CLAUDE.md`](./CLAUDE.md) for architecture, data model, coding conventions,
and DFM constraints, and [`docs/STATUS.md`](./docs/STATUS.md) for the current
build status and the path to first customers.

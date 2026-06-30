# SheetMates — Build Status & Path to First Customers

_Last updated: 2026-06-30 (customer-readiness audit + checkout hardening)._

## Where it stands

SheetMates is roughly an **MVP minus the final fulfillment + trust polish**. The
full customer journey exists and is wired to Firebase, the admin/ops surface is
real, and the unit suite (155 tests) is green.

### ✅ Working end-to-end
- **Upload → nest → live sheet**: DXF parse (with unit detection), shelf-packer
  nesting, auto-assign to a matching open sheet, persisted to Firestore.
- **Admin/ops**: sheet injection with QR labels, inventory, editable pricing
  config, order management, and a `full → cutting → done` production queue.
- **Payments**: server-authoritative Stripe Checkout (see below), webhook with
  signature + amount verification, orders written via the Admin SDK.
- **Security baseline**: Firestore/Storage rules lock orders, pricing, and DXF
  ownership. Auth (email + Google). i18n complete in en/fr/cs.

### 🔧 Fixed in this pass (checkout hardening)
1. **Server-authoritative pricing.** `/api/checkout` recomputes prices from the
   part's stored geometry + `pricingConfig`; the client no longer sends amounts.
   Parts now carry `material`/`thickness`.
2. **VAT correct.** VAT is itemized as its own Stripe line; the amount charged
   equals the displayed gross total. The webhook confirms `amount_total`.
3. **Order integrity.** Orders are created server-side via the Admin SDK
   (matching the `orders: create if false` rule, which the old client path
   violated). The webhook marks `paid` only after amount match.
4. **Success page verifies.** It checks the Stripe session via
   `/api/checkout/session` before showing success, and surfaces pending/failed.
5. **Admin provisioning.** `functions/grantAdmin` callable + `set-admin` bootstrap
   script set the `admin` claim and `users/{uid}.role`.
6. **Cloud Functions + deploy.** `functions/` adds hourly stale-lock cleanup and
   guest-draft TTL cleanup; `firebase.json` wires the functions codebase.

## Path to first customers

### P0 — before charging anyone
- [x] Server-side price recompute + part material/thickness
- [x] VAT charged correctly through Stripe
- [x] Orders created/confirmed server-side
- [x] Success page verifies payment
- [x] Admin provisioning + TTL cleanup functions
- [ ] **Smoke-test the live money path** end-to-end with Stripe test keys
      (upload → checkout → webhook → order `paid` → appears in admin queue).
- [ ] Provision the first admin on the real project and create initial inventory.

### P1 — first real production run
- [x] **Real production DXF export.** `lib/export/` now emits a valid AC1015
      (R2000) DXF per sheet with each part's *true* geometry (arcs/circles/ellipses/
      splines preserved), transformed by its placement, in millimetres
      ($INSUNITS=4). Geometry comes from the original uploaded DXF (re-parsed from
      Storage; `svgPath` is a lossy fallback for legacy parts). No kerf is baked into
      contours — the laser controller applies half-kerf from its tech tables, so
      pre-offsetting would double-compensate. Operators download via the admin-gated
      `GET /api/export/sheet/[sheetId]` route (button on the production queue).
      See `docs/plans/2026-06-30-dxf-export-research.md`. Validated with an ezdxf
      audit (0 errors) and Vitest round-trips through `dxf-parser`.
- [ ] Acquire the sheet lock during checkout (`use-sheet-lock` is built but
      unused) so two buyers can't claim the last capacity simultaneously.
- [ ] Order confirmation email (the success copy promises one; nothing sends it).

### P2 — soon after
- [ ] Build the WASM `libnest2d` engine (`wasm/build.sh`) for ~10–15% better
      utilization; the fallback to shelf-packer is automatic until then.
- [ ] Wire the Dutch-auction pricing (`lib/pricing/auction.ts`, fully tested)
      into the live pricing path behind a flag.
- [ ] Surface DFM warnings (computed in `lib/dxf/dfm-checks.ts`) in the upload UI.
- [ ] Rate-limit `/api/checkout`; add basic order/audit logging.

## Known gaps / notes
- The production build requires Firebase env vars (a public page initializes
  Firebase at build time); set `.env.local` from `.env.example` before `npm run build`.
- `revenue chart` on the admin dashboard groups all orders as "Recent" rather
  than by month.

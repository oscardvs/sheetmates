# SheetMates Admin User Guide

This guide explains how to manage the SheetMates platform as an administrator (factory operator).

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Accessing the Admin Panel](#accessing-the-admin-panel)
3. [Dashboard](#dashboard)
4. [Injecting New Sheets](#injecting-new-sheets)
5. [Managing the Production Queue](#managing-the-production-queue)
6. [Order Management](#order-management)
7. [Pricing Configuration](#pricing-configuration)
8. [Common Workflows](#common-workflows)

---

## Platform Overview

SheetMates is a community-driven fabrication marketplace that transforms virgin buffer sheets into accessible laser cutting services. The platform works as follows:

1. **You (Tech-Centrum) inject sheets** - Add available buffer sheets to the platform with material type, dimensions, and pricing
2. **Community uploads parts** - Users upload DXF files which are automatically parsed for dimensions, area, and cut length
3. **Parts are nested on sheets** - The system aggregates user parts onto shared sheets
4. **Sheets reach utilization threshold** - When a sheet is sufficiently filled (≥85% utilization), it moves to the production queue
5. **You cut and ship** - Process the sheet on the laser cutter, then ship parts to customers

### Sheet Status Flow

```
open → full → cutting → done
```

- **open**: Accepting new parts for nesting
- **full**: Utilization threshold reached, ready for production
- **cutting**: Currently being processed on the laser
- **done**: Cutting complete, ready for shipping

---

## Accessing the Admin Panel

Navigate to `/admin` after logging in with an admin account.

The admin sidebar provides access to:
- **Dashboard** - Overview of revenue and orders
- **Production Queue** - Manage sheets being cut
- **Orders** - Track and update order status
- **Pricing** - Configure pricing parameters
- **Inject Sheet** - Add new buffer sheets to the platform

---

## Dashboard

**URL:** `/admin`

The dashboard provides a real-time overview of platform performance:

### Metrics Cards

| Metric | Description |
|--------|-------------|
| **Revenue** | Total revenue from paid orders (excludes pending) |
| **Total Orders** | Count of all orders in the system |
| **Paid Orders** | Count of orders with status other than "pending" |

### Revenue Chart

A bar chart showing revenue trends. Data is aggregated by period to help identify sales patterns.

### Recent Orders Table

Displays the 20 most recent orders with:
- **Order ID** - First 8 characters of the unique identifier
- **User** - First 8 characters of the user ID
- **Items** - Number of parts in the order
- **Total** - Order value including VAT
- **Status** - Current order status (color-coded badge)

---

## Injecting New Sheets

**URL:** `/admin` sidebar → "Inject Sheet"

When you have buffer sheets available from industrial runs, add them to the platform:

### Sheet Parameters

| Field | Default | Description |
|-------|---------|-------------|
| **Width** | 3000 mm | Sheet width (standard: 3000mm) |
| **Height** | 1500 mm | Sheet height (standard: 1500mm) |
| **Material** | Steel | steel, stainless, aluminum, copper |
| **Thickness** | 3 mm | Available: 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 mm |
| **Quantity** | 1 | Number of identical sheets to inject |
| **Initial Price** | €100 | Starting price for Dutch auction (planned feature) |
| **Floor Price** | €20 | Minimum price the sheet will reach |

### After Injection

Successfully injected sheets display QR codes that can be printed as labels. These QR codes link to the sheet details and help track physical sheets in the warehouse.

**Tip:** When a batch of material arrives, immediately inject the buffer sheets so the community can start filling them.

---

## Managing the Production Queue

**URL:** `/admin/queue`

The production queue shows sheets that are ready for or currently in production.

### Queue Sections

#### In Progress (Cutting)
Sheets currently being processed on the laser cutter. Each card shows:
- Sheet ID (first 8 characters)
- Material and thickness
- Dimensions
- Number of nested parts
- Utilization percentage

**Action:** Click "Mark Complete" when cutting is finished.

#### Ready to Cut (Full)
Sheets that have reached the utilization threshold and are waiting to be processed.

**Action:** Click "Start Cutting" when you load the sheet onto the laser.

### Status Updates

Status changes automatically:
- Notify relevant users that their parts are being processed
- Update the order status for affected orders
- Refresh the dashboard metrics

### Queue Refresh

The queue automatically refreshes every 30 seconds to show the latest status.

---

## Order Management

**URL:** `/admin/orders`

Track and manage all customer orders.

### Filtering Orders

| Filter | Options |
|--------|---------|
| **Search** | Filter by Order ID, User Email, or User ID |
| **Status** | All, Pending, Paid, Processing, Shipped, Delivered |

### Order Status Workflow

```
pending → paid → processing → shipped → delivered
```

| Status | Description |
|--------|-------------|
| **Pending** | Order created, awaiting payment |
| **Paid** | Payment confirmed via Stripe |
| **Processing** | Parts are being cut (automatically set when sheet cutting starts) |
| **Shipped** | Parts have been dispatched |
| **Delivered** | Customer has received the parts |

### Updating Order Status

Click the status badge dropdown on any order row to change its status. This is typically used to:
1. Mark orders as "Shipped" after packaging and handoff to carrier
2. Mark orders as "Delivered" after delivery confirmation

**Note:** The system automatically transitions orders to "Processing" when you start cutting the associated sheet.

### Order Details

Each order row displays:
- **Order ID** - Unique identifier (first 8 chars shown)
- **Customer** - Email address or User ID
- **Items** - Number of parts in the order
- **Subtotal** - Price before VAT
- **Total** - Final price including VAT (21%)

---

## Pricing Configuration

**URL:** `/admin/pricing`

Configure the pricing engine that calculates part costs.

### Base Rates

| Parameter | Description |
|-----------|-------------|
| **Per cm² rate** | Cost per square centimeter of material used |
| **Per mm cut rate** | Cost per millimeter of laser cutting |
| **Minimum price** | Minimum charge for any part |
| **VAT rate** | Belgian VAT (21% by default) |
| **Complexity multiplier** | Factor for complex geometries |
| **Bulk discount threshold** | Quantity at which bulk discount applies |
| **Bulk discount %** | Percentage discount for bulk orders |

### Material Multipliers

Adjust pricing per material type:
- **Steel** - Base multiplier (typically 1.0)
- **Stainless** - Premium multiplier (typically 1.5-2.0)
- **Aluminum** - Weight-adjusted multiplier
- **Copper** - Premium multiplier for specialized material

### Thickness Multipliers

Adjust pricing based on material thickness. Thicker materials require:
- More laser power
- Slower cutting speeds
- Higher gas consumption

Typical multipliers increase with thickness (e.g., 1.0 for 1mm, up to 3.0 for 20mm).

### Saving Changes

Click "Save" to persist pricing changes. Changes apply immediately to new quotes but do not affect existing orders.

---

## Common Workflows

### Daily Operations

1. **Morning**
   - Check the Production Queue for sheets ready to cut
   - Review overnight orders on the Dashboard
   - Process any "Full" sheets that reached threshold overnight

2. **During Production**
   - Start sheets in order of filling time (first-in, first-out)
   - Mark sheets as "Cutting" when loaded
   - Mark sheets as "Complete" when done
   - System automatically updates related order statuses

3. **End of Day**
   - Package completed parts
   - Update order status to "Shipped"
   - Inject any new buffer sheets that arrived

### When New Material Arrives

1. Navigate to Inject Sheet form
2. Enter sheet specifications (material, thickness, dimensions)
3. Set quantity based on available buffer
4. Configure initial/floor pricing for auction (if enabled)
5. Click "Inject" to add to platform
6. Print QR labels for physical sheets

### Handling Order Issues

**Customer wants to cancel (before cutting):**
- Not directly supported in UI
- Contact support to manually refund via Stripe dashboard
- Update order status accordingly

**Part has quality issues:**
- Recut on next available sheet
- Contact customer about delay
- Update order with notes (planned feature)

### Pricing Strategy

**Cost-Plus Model (Current):**
```
Price = (Area × PerCm²Rate + CutLength × PerMmCutRate)
        × MaterialMultiplier × ThicknessMultiplier
        - BulkDiscount
        + VAT
```

**Recommendations:**
- Set base rates to cover material cost + machine time + margin
- Use multipliers to account for cutting difficulty
- Review quarterly against actual costs
- Consider competitor pricing when setting multipliers

---

## Troubleshooting

### Sheet not appearing in queue
- Verify sheet was successfully injected (check for QR code display)
- Confirm sheet status is "full" (not "open" or already "done")
- Refresh the page or wait for auto-refresh (30 seconds)

### Order status not updating
- Check network connection
- Verify you have admin permissions
- Try refreshing the page
- Status updates may take a few seconds to propagate

### Pricing seems incorrect
- Review all multipliers in Pricing Configuration
- Check that the correct material/thickness is selected
- Verify bulk discount thresholds
- Remember VAT (21%) is added to displayed prices

### QR codes not printing
- Ensure browser allows popups
- Check printer connection
- Use "Print Label" button or right-click → Print

---

## Support

For technical issues or feature requests, contact the development team or create an issue in the project repository.

**Important Reminders:**
- All data is hosted in `europe-west1` (Belgium) for GDPR compliance
- Guest sessions auto-delete after 24 hours
- Price calculations are validated server-side (Firestore rules)
- Stripe handles all payment processing securely

---

*Document last updated: February 2026*

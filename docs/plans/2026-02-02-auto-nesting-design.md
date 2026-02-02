# Auto-Nesting & DXF Unit Conversion Design

**Date**: 2026-02-02
**Status**: Approved

## Overview

Two features to complete the upload-to-sheet flow:
1. DXF unit detection and conversion to mm
2. Auto-nesting parts onto sheets after upload

## Part A: DXF Unit Detection & Conversion

### Problem
DXF files can be created in different units (inches, mm, feet). The parser currently assumes mm, causing incorrect dimensions when files are drawn in other units.

### Solution
Detect units from the DXF `$INSUNITS` header variable and convert to mm.

### Unit Codes (AutoCAD standard)
| Code | Unit | Conversion |
|------|------|------------|
| 0 | Unitless | Heuristic |
| 1 | Inches | × 25.4 |
| 2 | Feet | × 304.8 |
| 4 | Millimeters | × 1 |
| 5 | Centimeters | × 10 |

### Heuristic for Unitless Files
If both width and height < 50, assume inches and convert. This catches common case of files drawn in inches without unit metadata.

### Implementation
**Location**: `lib/dxf/parser.ts`

- Add `detectUnits()` function reading `$INSUNITS` from parsed DXF header
- Add `convertToMm()` function scaling all coordinates
- Apply conversion before computing bounding box

**Updated interface**:
```typescript
interface ParsedDxf {
  entities: DxfEntity[];
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  width: number;
  height: number;
  detectedUnit: "mm" | "inches" | "feet" | "cm" | "unknown";
  wasConverted: boolean;
}
```

## Part B: Material & Thickness Selector

### Location
Upload page, above the file drop zone.

### Options
**Materials**: Steel, Stainless Steel, Aluminum, Copper

**Thicknesses**: 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 mm

**Defaults**: Steel, 2mm

### UI Layout
```
┌─────────────────────────────────────────────┐
│ [MATERIAL ▼]  [THICKNESS ▼]                 │
│  Steel         2mm                          │
├─────────────────────────────────────────────┤
│                                             │
│     Drop DXF files here                     │
│                                             │
└─────────────────────────────────────────────┘
```

## Part C: Auto-Nesting Flow

### Trigger
After parts are saved to Firestore in `handlePartsReady()`.

### Flow

1. **Find matching open sheet**
   - Query: `material === selected AND thickness === selected AND status === "open"`
   - If found, use first match
   - If not found, create new 3000×1500mm sheet

2. **Gather parts to nest**
   - Existing parts from sheet.placements
   - Newly uploaded parts
   - Convert to `NestingPart[]` format

3. **Run shelf-packer**
   - `shelfPack(allParts, sheetDimensions, kerfMm=2)`
   - Returns placements[] and utilization

4. **Update Firestore** (batch write)
   - Sheet: placements, utilization, status
   - Parts: status="nested", sheetId, position

### New Function
**Location**: `lib/nesting/auto-nest.ts`

```typescript
async function autoNestParts(
  partIds: string[],
  material: string,
  thickness: number
): Promise<{ sheetId: string; placements: NestingPlacement[] }>
```

## Part D: Updated Upload Flow

### Before
```
Upload DXF → Parse → Save Part (pending) → Toast → Redirect /queue
```

### After
```
Select Material/Thickness → Upload DXF → Parse → Convert Units
→ Save Part (pending) → Auto-Nest → Update Part + Sheet
→ Toast → Redirect /sheets/[id]
```

## Edge Cases & Error Handling

| Case | Behavior |
|------|----------|
| Part too large (>3000×1500mm) | Keep as pending, warning toast |
| Sheet >85% utilization | Set status="full", next upload creates new sheet |
| Multiple parts, some don't fit | Nest what fits, rest stay pending |
| No existing open sheet | Create new sheet with selected material/thickness |
| Unit conversion applied | Info toast: "Converted from inches to mm" |
| Network/Firestore error | Error toast, parts may be pending in queue |

## Files to Modify

1. `lib/dxf/parser.ts` - Unit detection and conversion
2. `components/dxf-uploader.tsx` - Material/thickness selector props
3. `app/[locale]/(protected)/upload/page.tsx` - Material state, updated flow
4. `lib/nesting/auto-nest.ts` - NEW: Auto-nesting function
5. `messages/*.json` - New translation keys

## Success Criteria

- [ ] DXF files in inches display correct mm dimensions
- [ ] User can select material and thickness before upload
- [ ] Parts auto-nest onto matching open sheet
- [ ] Sheet utilization updates correctly
- [ ] User redirected to sheet view after upload
- [ ] Parts too large stay as pending with warning

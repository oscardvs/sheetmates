# Production DXF Export — Research & Design Memo

_Author: fabrication-software engineering. Date: 2026-06-30._
_Tracks: STATUS.md P1 item "Real production DXF export"; CLAUDE.md tech-debt #2._

## 1. Problem

`lib/export/dxf-writer.ts` is a stub. It emits the sheet and each part as a
**bounding-box rectangle of four `LINE`s**: it discards the real outline, ignores
rotation beyond the rectangle's width/height swap, encodes no units, and is wired
to a single un-gated `/export` page. A Tech-Centrum operator cannot cut from it —
every part would come out as a plain rectangle.

We need: **one valid DXF per sheet** containing every placed part's *true* outline
(arcs as arcs, circles as circles, closed loops closed), transformed by its
placement (x, y, rotation), in millimetres, that opens directly in fiber-laser CAM
(Trumpf TruTops/Boost on the TruLaser 3030) and cuts faithfully with no manual fixing.

## 2. Open questions — decisions up front

| # | Question | Decision | Why (short) |
|---|----------|----------|-------------|
| 1 | Geometry source: original DXF entities vs stored `svgPath` | **Original DXF entities** (parse the uploaded file fresh); `svgPath` is a **fallback** for legacy parts with no stored file | `svgPath` is lossy: Y-flipped, arcs already approximated, splines/ellipses degraded. Re-parsing the original keeps true arcs/circles/ellipses/splines. |
| 2 | Kerf compensation in the DXF | **No.** Emit nominal part outlines. Spacing between parts (packer's 2 mm) is preserved by placement, not baked into contours | Fiber-laser CAM applies half-kerf offset at the controller from material/thickness tech tables; pre-offsetting the DXF **double-compensates** and ruins dimensions. |
| 3 | DXF version target | **R2000 / AC1015** | Lowest version with native `LWPOLYLINE`, `ELLIPSE`, and `SPLINE` (true NURBS); universally read by modern laser CAM. R12 cannot carry ellipses/splines or `LWPOLYLINE`. |
| 4 | Library vs hand-rolled writer | **Hand-rolled** AC1015 writer in `lib/export/` | No new runtime dependency / supply-chain surface; the already-present `dxf-parser` round-trips our output in tests; full control over layers, units, and entity fidelity. Maker.js flattens curves through its own model; `@tarikjabiri/dxf` churns its API across majors. |

## 3. Findings

### 3.1 Geometry source — original entities win, decisively

The stored `PartDoc.svgPath` is produced by `lib/dxf/to-svg.ts`, which:
- **flips Y** (`height - (y - offsetY)`) — SVG is Y-down, DXF is Y-up. Round-tripping
  through it and forgetting to un-flip would **mirror** every part. A mirrored
  asymmetric bracket does not fit its mating holes — a real scrap risk.
- **approximates arcs**: `ARC`/`CIRCLE`/`ELLIPSE` become SVG `A` commands;
  `SPLINE` becomes cubic/quadratic Béziers using control points directly as Bézier
  handles (not a true NURBS evaluation). Both are visual approximations.

By contrast, `dxf-parser` (already a dependency, v1.1.2) exposes the **full** entity
data we need to re-emit losslessly: for `SPLINE` it yields `controlPoints`,
`fitPoints`, `knotValues`, `degreeOfSplineCurve`, and the closed/periodic/rational
flags; for `ELLIPSE` it yields `center`, `majorAxisEndPoint` (relative to centre),
`axisRatio`, and start/end params; for `LWPOLYLINE` it yields per-vertex `bulge`
and the closed flag (group 70 bit 1). (Verified in
`node_modules/dxf-parser/src/entities/{spline,ellipse,lwpolyline}.ts`.)

**Crucially, we re-parse the original file directly rather than going through the
app's `ParsedDxf` wrapper** (`lib/dxf/parser.ts`), which strips knots/degree/ellipse
params. The original DXF is already uploaded to Firebase Storage at
`dxf/{userId}/{ts}_{name}` (`lib/firebase/storage.ts`) — but the upload flow today
**discards the download URL** (`void downloadUrl` in `app/[locale]/(protected)/upload/page.tsx`).
So the enabling change is: **persist the Storage path on the part**
(`PartDoc.dxfStoragePath`) and fetch+parse it server-side at export time.

Reference implementations confirm this is the standard approach: ezdxf (the de-facto
Python DXF library) models each entity type natively and transforms by affine matrix
rather than flattening; nesting tools (Deepnest/libnest2d front-ends) re-emit source
entities translated/rotated per placement rather than rasterising.

### 3.2 Rotation must be a *rotation*, never a reflection

A pure rotation keeps every entity exactly valid with trivial bookkeeping:
- `LINE`/`LWPOLYLINE`/`SPLINE`/`fitPoints`/`controlPoints`: rotate the points.
- `CIRCLE`: rotate centre; radius unchanged.
- `ARC`: rotate centre; **add θ to start/end angle**; radius unchanged; CCW sense
  preserved (a reflection would require swapping/negating sweep).
- `ELLIPSE`: rotate centre and the (centre-relative) major-axis vector; `axisRatio`
  and start/end params unchanged.
- `LWPOLYLINE` **bulge is rotation-invariant** (it encodes signed sweep, not absolute
  orientation); it only flips sign under reflection.

This is exactly why we avoid the `svgPath` Y-flip in the primary path: a whole-sheet
reflection would mirror each part. We place parts Y-up in native DXF space and rotate
about the part origin only.

### 3.3 Kerf — do NOT compensate in the DXF (resolved definitively)

Industrial fiber lasers, including Trumpf, apply **kerf (cutter) compensation in the
controller/CAM**: the post-processor offsets the toolpath by half the beam/kerf width,
outward for outer contours and inward for holes, using values keyed to material and
thickness. If we export geometry already offset by half-kerf, the controller offsets
*again* — **double compensation** — yielding outer profiles ~one kerf too small and
holes ~one kerf too large. The standard fabrication instruction is therefore: hand the
laser **nominal CAD geometry at true dimensions** and let the machine apply kerf.

Note the packer's `kerfMm` (default 2 mm in `lib/nesting/shelf-packer.ts`) is a
**part-to-part spacing gap** for nesting, not a cut-width compensation. We honour it
purely by preserving each part's placed position; contours stay nominal. (Industrial
fiber kerf is ~0.1–0.2 mm — far smaller than the 2 mm nesting gap, reinforcing that
the 2 mm is spacing, not kerf.)

### 3.4 Units — `$INSUNITS = 4`

`$INSUNITS = 4` means millimetres (ezdxf units docs; AutoCAD DXF reference). All app
geometry is already normalised to mm by `lib/dxf/parser.ts`. We also set
`$MEASUREMENT = 1` (metric) so linetype/hatch pattern selection is consistent. Getting
units explicit is the single most common cause of "imported at 25.4× scale" laser-CAM
errors, so we encode them in the header rather than relying on the importer's default.

### 3.5 Version — R2000 / AC1015

The capability cliff is between R12 (AC1009) and R2000 (AC1015): below R2000 there is
**no `LWPOLYLINE`**, **no `ELLIPSE`**, and **no native `SPLINE`** (curves must be
chord-approximated). R2000 is the lowest version that carries splines as splines and
is "fully modern," and every current laser/CNC controller reads it; sources recommend
R2000+ (commonly R2010) as the default for sheet-metal flat patterns, reserving R12
only when a customer explicitly demands it. We target **AC1015** because it is the
*minimum* version that meets the fidelity bar (true ellipse + spline) while maximising
backward compatibility. ARC/CIRCLE — the entities the task most stresses preserving —
are native in both versions; we never facet them.

### 3.6 Library vs hand-rolled

- **Maker.js**: strong affine/layout tooling, but its DXF export serialises *its own*
  model (lines/arcs/circles/beziers); ellipses and splines are not preserved as native
  DXF `ELLIPSE`/`SPLINE`, so round-tripping our parsed entities through it loses
  exactly the fidelity we are trying to keep.
- **`@tarikjabiri/dxf` (dxfjs/writer)** / **js-dxf / dxf-writer**: capable AC1015
  writers, but each adds a dependency and the tarikjabiri API has renamed across major
  versions.
- **Hand-rolled**: AC1015's text structure is well documented; we need a focused writer
  for a known, small entity set (LINE, LWPOLYLINE, CIRCLE, ARC, ELLIPSE, SPLINE, TEXT).
  The repo already ships `dxf-parser`, which **re-parses our output in unit tests**, and
  we validate independently with **ezdxf `audit()`**. No new runtime dependency, full
  control over layers/units. **Chosen.**

## 4. Chosen design

### 4.1 Layers (laser-CAM convention)
- `CUT` — all part cut contours (the toolpaths).
- `SHEET` — the 3000×1500 sheet boundary, informational; operator can ignore/disable.
- `LABEL` — per-part `TEXT` (part id / filename) for operator reference; **not** on the
  cut layer so it is never cut.

### 4.2 Pipeline
```
sheet + placements
   └─ for each placement:
        geometry = parse original DXF (Storage)         ← preferred, full fidelity
                   ?? parse stored svgPath (un-flip Y)   ← fallback, lossy
        normalise to part bbox origin                    (bbox metric matches the packer's)
        rotate about origin by placement.rotation        (rotation, never reflection)
        translate so rotated bbox min == (placement.x, placement.y)
        emit on layer CUT (+ TEXT label on LABEL)
   └─ sheet rectangle on layer SHEET
   └─ serialise AC1015 (HEADER $ACADVER=AC1015,$INSUNITS=4,$MEASUREMENT=1; TABLES; ENTITIES; OBJECTS)
```
Alignment uses a bbox computed with the **same metric the packer used**
(`lib/dxf/parser.ts` `computeBoundingBox`: line endpoints; centre±radius for
circle/arc; vertices for polylines; control points for splines) so parts land exactly
in their reserved cells and stay non-overlapping.

### 4.3 Modules (`lib/export/`)
- `dxf-entities.ts` — internal `ExportEntity` union (Y-up native geometry) + bbox.
- `dxf-transform.ts` — affine (rotate+translate) of `ExportEntity[]`; arc/ellipse
  angle handling.
- `from-dxf-parser.ts` — `dxf-parser` raw entities → `ExportEntity[]` (full fidelity).
- `from-svg-path.ts` — `svgPath` → `ExportEntity[]` with the Y un-flip (fallback).
- `dxf-writer.ts` — `ExportEntity[]` (+ layers) → AC1015 DXF string. (`generateNestingDxf`.)
- `__tests__/` — Vitest: round-trip via `dxf-parser`, transform correctness,
  multi-part placement, re-parse of full output.

### 4.4 Wiring
- Persist `dxfStoragePath` on `PartDoc` at upload.
- Server route `GET /api/export/sheet/[sheetId]` (admin-gated, Admin SDK): load sheet +
  parts, pull originals from Storage, build the DXF, stream it as
  `attachment; filename="sheet-<id>.dxf"`.
- Operator action: "Download DXF" on the production-queue sheet cards (full/cutting).

## 5. Definition of done
Operator downloads one DXF per full/cutting sheet, opens it in laser CAM, and cuts all
nested parts at correct positions, rotations, sizes, and true curves — no manual fixing.
Backed by the research above, unit tests, an ezdxf audit, and green `test`/`lint`/`tsc`.

## Sources
- DXF version / entity support (R12 vs R2000): CadShift, _DXF Version R12 vs R2000_ —
  https://cadshift.com/blog/dxf-version-r12-r2000-multi-view-solidworks/
- `$INSUNITS` = 4 (mm), `$MEASUREMENT`: ezdxf _DXF Units_ —
  https://ezdxf.readthedocs.io/en/stable/concepts/units.html ; AutoCAD 2012 DXF
  Reference — https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf
- Kerf handled by machine, not pre-offset in DXF / double-compensation risk:
  HYCNC _Exporting a DXF with no kerf cuts_; Tormach KB _Plasma Kerf Compensation with
  DXF Import_ — https://knowledgebase.tormach.com/1300pl/plasma-kerf-compensation-with-dxf-import ;
  Ferracut _What is Kerf in Laser Cutting_ — https://ferracut.com.au/blog/what-is-kerf-laser-cutting
- ezdxf (reference impl. of entity model + affine transforms + audit) —
  https://ezdxf.readthedocs.io/ ; SPLINE — https://ezdxf.readthedocs.io/en/stable/dxfentities/spline.html
- Maker.js DXF export — https://maker.js.org/docs/exporting/ ;
  `@tarikjabiri/dxf` (dxfjs/writer) — https://github.com/dxfjs/writer

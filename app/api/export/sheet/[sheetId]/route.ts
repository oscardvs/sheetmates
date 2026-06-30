import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  adminStorage,
  defaultBucketName,
} from "@/lib/firebase/admin";
import {
  generateNestingDxf,
  type PlacedPart,
} from "@/lib/export/dxf-writer";
import { parseOriginalDxfToEntities } from "@/lib/export/from-dxf-parser";
import { parseSvgPathToEntities } from "@/lib/export/from-svg-path";
import type { ExportEntity } from "@/lib/export/dxf-entities";

interface SheetPlacement {
  partId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

interface PartData {
  fileName?: string;
  svgPath?: string;
  dxfStoragePath?: string;
}

// Resolve a part's true geometry: prefer the original uploaded DXF (full fidelity),
// fall back to the stored svgPath (lossy, but keeps legacy parts cuttable).
async function loadPartGeometry(part: PartData): Promise<ExportEntity[] | null> {
  if (part.dxfStoragePath) {
    try {
      const bucket = adminStorage().bucket(defaultBucketName());
      const [buf] = await bucket.file(part.dxfStoragePath).download();
      const entities = parseOriginalDxfToEntities(buf.toString("utf8"));
      if (entities.length > 0) return entities;
    } catch (err) {
      console.error(
        `DXF export: failed to load original ${part.dxfStoragePath}, falling back to svgPath`,
        err
      );
    }
  }
  if (part.svgPath) {
    try {
      const entities = parseSvgPathToEntities(part.svgPath);
      if (entities.length > 0) return entities;
    } catch (err) {
      console.error("DXF export: svgPath fallback failed", err);
    }
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    // 1. Authenticate + authorize (admin/operator only).
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid: string;
    let isAdmin = false;
    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      uid = decoded.uid;
      isAdmin = decoded.admin === true;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = adminDb();
    if (!isAdmin) {
      // Fall back to the Firestore role in case the custom claim hasn't propagated.
      const userSnap = await db.collection("users").doc(uid).get();
      if (userSnap.data()?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 2. Load the sheet.
    const { sheetId } = await params;
    const sheetSnap = await db.collection("sheets").doc(sheetId).get();
    if (!sheetSnap.exists) {
      return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
    }
    const sheet = sheetSnap.data() as {
      width: number;
      height: number;
      material?: string;
      thickness?: number;
      placements?: SheetPlacement[];
    };
    const placements = sheet.placements ?? [];
    if (placements.length === 0) {
      return NextResponse.json(
        { error: "Sheet has no placed parts" },
        { status: 422 }
      );
    }

    // 3. Load each placed part and resolve its geometry.
    const partIds = [...new Set(placements.map((p) => p.partId))];
    const partSnaps = await db.getAll(
      ...partIds.map((id) => db.collection("parts").doc(id))
    );
    const partById = new Map<string, PartData>();
    for (const snap of partSnaps) {
      if (snap.exists) partById.set(snap.id, snap.data() as PartData);
    }

    const geometryCache = new Map<string, ExportEntity[] | null>();
    const placedParts: PlacedPart[] = [];
    const skipped: string[] = [];

    for (const placement of placements) {
      const part = partById.get(placement.partId);
      if (!part) {
        skipped.push(placement.partId);
        continue;
      }
      if (!geometryCache.has(placement.partId)) {
        geometryCache.set(placement.partId, await loadPartGeometry(part));
      }
      const entities = geometryCache.get(placement.partId);
      if (!entities) {
        skipped.push(placement.partId);
        continue;
      }
      placedParts.push({
        partId: placement.partId,
        entities,
        placement: {
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
        },
        label: part.fileName ?? placement.partId,
      });
    }

    if (placedParts.length === 0) {
      return NextResponse.json(
        { error: "No part geometry could be resolved for this sheet" },
        { status: 422 }
      );
    }

    // 4. Generate the DXF.
    const dxf = generateNestingDxf(
      {
        id: sheetId,
        width: sheet.width,
        height: sheet.height,
        material: sheet.material,
        thickness: sheet.thickness,
      },
      placedParts
    );

    return new NextResponse(dxf, {
      status: 200,
      headers: {
        "Content-Type": "application/dxf",
        "Content-Disposition": `attachment; filename="sheet-${sheetId}.dxf"`,
        // Surface any parts we couldn't include so the operator is not misled.
        "X-Parts-Skipped": String(skipped.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("DXF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate DXF" },
      { status: 500 }
    );
  }
}

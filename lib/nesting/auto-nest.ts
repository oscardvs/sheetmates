import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  type SheetDoc,
  type SheetPlacement,
} from "@/lib/firebase/db/sheets";
import { type PartDoc } from "@/lib/firebase/db/parts";
import { shelfPack } from "./shelf-packer";
import type { NestingPart } from "./types";

// Utilization threshold for marking sheet as full
const FULL_THRESHOLD = 0.85;

export class NoMatchingSheetError extends Error {
  constructor(material: string, thickness: number) {
    super(`No open sheet available for ${material} ${thickness}mm. Please contact admin.`);
    this.name = "NoMatchingSheetError";
  }
}

export interface AutoNestResult {
  sheetId: string;
  utilization: number;
  placedPartIds: string[];
  unplacedPartIds: string[];
}

/**
 * Auto-nest parts onto a matching sheet.
 * Finds an open sheet with the same material/thickness.
 * Throws NoMatchingSheetError if no matching sheet exists (admin must create sheets).
 * Then runs the shelf-packer and updates Firestore.
 */
export async function autoNestParts(
  parts: PartDoc[],
  material: string,
  thickness: number
): Promise<AutoNestResult> {
  // 1. Find an open sheet with matching material/thickness
  const sheet = await findOpenSheet(material, thickness);

  if (!sheet) {
    // No matching sheet - admin needs to create one first
    throw new NoMatchingSheetError(material, thickness);
  }

  // 2. Gather all parts to nest (existing + new)
  const existingParts = await getPartsOnSheet(sheet.id);
  const allParts = [...existingParts, ...parts];

  // 3. Convert to nesting format
  const nestingParts: NestingPart[] = allParts.map((p) => ({
    id: p.id,
    width: p.boundingBox.width,
    height: p.boundingBox.height,
    quantity: p.quantity,
    svgPath: p.svgPath,
  }));

  // 4. Run shelf-packer
  const result = shelfPack(
    nestingParts,
    { width: sheet.width, height: sheet.height },
    2 // kerf
  );

  // 5. Separate placed vs unplaced parts
  const placedPartIds = new Set<string>();
  const sheetPlacements: SheetPlacement[] = [];

  for (const placement of result.placements) {
    if (placement.sheetIndex === 0) {
      placedPartIds.add(placement.partId);
      sheetPlacements.push({
        partId: placement.partId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        rotation: placement.rotation,
      });
    }
  }

  // Find parts that couldn't fit (on sheet index > 0 or not placed)
  const placedNewPartIds = parts
    .filter((p) => placedPartIds.has(p.id))
    .map((p) => p.id);
  const unplacedPartIds = parts
    .filter((p) => !placedPartIds.has(p.id))
    .map((p) => p.id);

  // 6. Update Firestore in a batch
  const batch = writeBatch(db);

  // Update sheet
  const utilization = result.utilization[0] || 0;
  const newStatus = utilization >= FULL_THRESHOLD ? "full" : "open";

  batch.update(doc(db, "sheets", sheet.id), {
    placements: sheetPlacements,
    utilization,
    status: newStatus,
  });

  // Update each placed part
  for (const partId of placedNewPartIds) {
    const placement = sheetPlacements.find((p) => p.partId === partId);
    if (placement) {
      batch.update(doc(db, "parts", partId), {
        status: "nested",
        sheetId: sheet.id,
        position: {
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
        },
      });
    }
  }

  await batch.commit();

  return {
    sheetId: sheet.id,
    utilization,
    placedPartIds: placedNewPartIds,
    unplacedPartIds,
  };
}

/**
 * Find an open sheet with matching material and thickness.
 */
async function findOpenSheet(
  material: string,
  thickness: number
): Promise<SheetDoc | null> {
  const sheetsRef = collection(db, "sheets");
  const q = query(
    sheetsRef,
    where("material", "==", material),
    where("thickness", "==", thickness),
    where("status", "==", "open")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  // Return the first open sheet
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as SheetDoc;
}

/**
 * Get all parts currently on a sheet.
 */
async function getPartsOnSheet(sheetId: string): Promise<PartDoc[]> {
  const partsRef = collection(db, "parts");
  const q = query(partsRef, where("sheetId", "==", sheetId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PartDoc[];
}

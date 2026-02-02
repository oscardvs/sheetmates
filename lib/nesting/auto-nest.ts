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
  createSheet,
  type SheetDoc,
  type SheetPlacement,
} from "@/lib/firebase/db/sheets";
import { type PartDoc } from "@/lib/firebase/db/parts";
import { shelfPack } from "./shelf-packer";
import type { NestingPart } from "./types";

// Standard TC buffer sheet dimensions
const STANDARD_SHEET_WIDTH = 3000;
const STANDARD_SHEET_HEIGHT = 1500;

// Utilization threshold for marking sheet as full
const FULL_THRESHOLD = 0.85;

export interface AutoNestResult {
  sheetId: string;
  utilization: number;
  placedPartIds: string[];
  unplacedPartIds: string[];
  isNewSheet: boolean;
}

/**
 * Auto-nest parts onto a matching sheet.
 * Finds an open sheet with the same material/thickness, or creates one.
 * Then runs the shelf-packer and updates Firestore.
 */
export async function autoNestParts(
  parts: PartDoc[],
  material: string,
  thickness: number
): Promise<AutoNestResult> {
  // 1. Find an open sheet with matching material/thickness
  let sheet = await findOpenSheet(material, thickness);
  let isNewSheet = false;

  if (!sheet) {
    // Create a new sheet
    const sheetId = await createSheet({
      width: STANDARD_SHEET_WIDTH,
      height: STANDARD_SHEET_HEIGHT,
      material,
      thickness,
      placements: [],
      utilization: 0,
      status: "open",
    });
    sheet = {
      id: sheetId,
      width: STANDARD_SHEET_WIDTH,
      height: STANDARD_SHEET_HEIGHT,
      material,
      thickness,
      placements: [],
      utilization: 0,
      status: "open",
      createdAt: null,
    };
    isNewSheet = true;
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
    isNewSheet,
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

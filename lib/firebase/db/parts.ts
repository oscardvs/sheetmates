import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";

export interface PartDoc {
  id: string;
  userId: string;
  fileName: string;
  /** Material the part is cut from (e.g. "steel"). Drives pricing multipliers. */
  material: string;
  /** Sheet thickness in mm. Drives pricing multipliers. */
  thickness: number;
  boundingBox: { width: number; height: number };
  svgPath: string;
  /**
   * Storage path of the original uploaded DXF (e.g. `dxf/{uid}/{ts}_{name}`).
   * Used by the production DXF export to re-emit true geometry; absent on legacy
   * parts, which fall back to `svgPath`.
   */
  dxfStoragePath?: string;
  area: number;
  cutLength: number;
  quantity: number;
  status: "pending" | "nested" | "cut" | "shipped";
  sheetId: string | null;
  position: { x: number; y: number; rotation: number } | null;
  createdAt: unknown;
}

const partsCol = collection(db, "parts");

export async function createPart(
  data: Omit<PartDoc, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(partsCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPart(id: string): Promise<PartDoc | null> {
  const snap = await getDoc(doc(db, "parts", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PartDoc) : null;
}

export async function getPartsByUser(userId: string): Promise<PartDoc[]> {
  const q = query(partsCol, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PartDoc);
}

export async function getPartsByStatus(
  status: PartDoc["status"]
): Promise<PartDoc[]> {
  const q = query(partsCol, where("status", "==", status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PartDoc);
}

export async function getPartsBySheetId(sheetId: string): Promise<PartDoc[]> {
  const q = query(partsCol, where("sheetId", "==", sheetId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PartDoc);
}

export async function updatePart(
  id: string,
  data: Partial<Omit<PartDoc, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "parts", id), data);
}

export async function deletePart(id: string): Promise<void> {
  await deleteDoc(doc(db, "parts", id));
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";

export interface SheetPlacement {
  partId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

export interface SheetDoc {
  id: string;
  width: number;
  height: number;
  material: string;
  thickness: number;
  placements: SheetPlacement[];
  utilization: number;
  status: "open" | "full" | "cutting" | "done";
  createdAt: unknown;

  // Auction fields
  auctionEnabled?: boolean;
  initialPrice?: number;
  floorPrice?: number;
  decayRate?: number;
  auctionStartTime?: unknown; // Firestore Timestamp

  // Locking fields
  currentLockHolder?: string | null;
  lockExpiry?: unknown;
  lockAcquiredAt?: unknown;
}

const sheetsCol = collection(db, "sheets");

export async function createSheet(
  data: Omit<SheetDoc, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(sheetsCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSheet(id: string): Promise<SheetDoc | null> {
  const snap = await getDoc(doc(db, "sheets", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SheetDoc) : null;
}

export async function getAllSheets(): Promise<SheetDoc[]> {
  const snap = await getDocs(sheetsCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SheetDoc);
}

export async function updateSheet(
  id: string,
  data: Partial<Omit<SheetDoc, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "sheets", id), data);
}

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../config";
import type { SheetDoc } from "./sheets";

export async function getProductionQueue(): Promise<SheetDoc[]> {
  const sheetsCol = collection(db, "sheets");
  const q = query(
    sheetsCol,
    where("status", "in", ["full", "cutting"]),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SheetDoc);
}

export async function updateSheetStatus(
  sheetId: string,
  status: "cutting" | "done"
): Promise<void> {
  await updateDoc(doc(db, "sheets", sheetId), { status });
}

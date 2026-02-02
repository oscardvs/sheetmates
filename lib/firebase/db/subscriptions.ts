import { doc, onSnapshot, collection, query, where, type FirestoreError } from "firebase/firestore";
import { db } from "../config";
import type { SheetDoc } from "./sheets";

export function subscribeToSheet(
  sheetId: string,
  callback: (sheet: SheetDoc | null) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  const docRef = doc(db, "sheets", sheetId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as SheetDoc);
      } else {
        callback(null);
      }
    },
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeToOpenSheets(
  callback: (sheets: SheetDoc[]) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  const q = query(collection(db, "sheets"), where("status", "==", "open"));
  return onSnapshot(
    q,
    (snap) => {
      const sheets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SheetDoc);
      callback(sheets);
    },
    (error) => {
      onError?.(error);
    }
  );
}

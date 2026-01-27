import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: unknown;
  updatedAt: unknown;
}

const usersCol = "users";

export async function createUserDoc(
  uid: string,
  data: { email: string; displayName: string }
): Promise<void> {
  await setDoc(doc(db, usersCol, uid), {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserDoc(
  uid: string
): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, usersCol, uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function updateUserDoc(
  uid: string,
  data: Partial<Pick<UserDoc, "displayName" | "role">>
): Promise<void> {
  await updateDoc(doc(db, usersCol, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

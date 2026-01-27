import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";

export interface OrderItem {
  partId: string;
  fileName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface OrderDoc {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered";
  stripeSessionId: string | null;
  createdAt: unknown;
}

const ordersCol = collection(db, "orders");

export async function createOrder(
  data: Omit<OrderDoc, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(ordersCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getOrder(id: string): Promise<OrderDoc | null> {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as OrderDoc) : null;
}

export async function getOrdersByUser(userId: string): Promise<OrderDoc[]> {
  const q = query(
    ordersCol,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrderDoc);
}

export async function getAllOrders(): Promise<OrderDoc[]> {
  const q = query(ordersCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrderDoc);
}

export async function updateOrder(
  id: string,
  data: Partial<Omit<OrderDoc, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "orders", id), data);
}

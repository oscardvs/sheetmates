import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config";
import { calculateDynamicDecayRate } from "@/lib/pricing/auction";

export interface InjectSheetInput {
  width: number;
  height: number;
  material: string;
  thickness: number;
  quantity: number;
  initialPrice: number;
  floorPrice: number;
  qrCodePrefix?: string;
}

export interface InjectedSheet {
  id: string;
  qrCode: string;
}

export async function injectSheet(
  input: InjectSheetInput,
  inventoryCount: number = 10
): Promise<InjectedSheet[]> {
  const sheetsCol = collection(db, "sheets");
  const results: InjectedSheet[] = [];

  const decayRate = calculateDynamicDecayRate(inventoryCount);

  for (let i = 0; i < input.quantity; i++) {
    const qrCode = `${input.qrCodePrefix ?? "SM"}-${Date.now()}-${i}`;

    const docRef = await addDoc(sheetsCol, {
      width: input.width,
      height: input.height,
      material: input.material,
      thickness: input.thickness,
      placements: [],
      utilization: 0,
      status: "open",

      // Auction config
      auctionEnabled: true,
      initialPrice: input.initialPrice,
      floorPrice: input.floorPrice,
      decayRate,
      auctionStartTime: serverTimestamp(),

      // Tracking
      qrCode,
      injectedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    results.push({ id: docRef.id, qrCode });
  }

  return results;
}

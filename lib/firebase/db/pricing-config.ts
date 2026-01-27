import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config";

export interface PricingConfig {
  perCm2Rate: number;
  perMmCutRate: number;
  materialMultipliers: Record<string, number>;
  thicknessMultipliers: Record<string, number>;
  complexityMultiplier: number;
  bulkDiscountThreshold: number;
  bulkDiscountPercent: number;
  minimumPrice: number;
  vatRate: number;
}

const PRICING_DOC_ID = "default";

export async function getPricingConfig(): Promise<PricingConfig> {
  const snap = await getDoc(doc(db, "pricingConfig", PRICING_DOC_ID));
  if (snap.exists()) {
    return snap.data() as PricingConfig;
  }
  return defaultPricingConfig;
}

export async function setPricingConfig(
  config: PricingConfig
): Promise<void> {
  await setDoc(doc(db, "pricingConfig", PRICING_DOC_ID), config);
}

export const defaultPricingConfig: PricingConfig = {
  perCm2Rate: 0.05,
  perMmCutRate: 0.01,
  materialMultipliers: {
    steel: 1.0,
    stainless: 1.8,
    aluminum: 1.4,
    copper: 2.5,
  },
  thicknessMultipliers: {
    "1": 1.0,
    "2": 1.2,
    "3": 1.5,
    "5": 2.0,
    "8": 3.0,
    "10": 4.0,
  },
  complexityMultiplier: 1.0,
  bulkDiscountThreshold: 10,
  bulkDiscountPercent: 10,
  minimumPrice: 5.0,
  vatRate: 0.21,
};

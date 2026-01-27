import type { PricingConfig } from "@/lib/firebase/db/pricing-config";
import { defaultPricingConfig } from "@/lib/firebase/db/pricing-config";

export interface PartPriceInput {
  areaMm2: number;
  cutLengthMm: number;
  material: string;
  thickness: string;
  quantity: number;
}

export interface PriceBreakdown {
  areaCost: number;
  cutCost: number;
  materialMultiplier: number;
  thicknessMultiplier: number;
  complexityMultiplier: number;
  subtotalPerUnit: number;
  bulkDiscount: number;
  pricePerUnit: number;
  totalBeforeVat: number;
  vat: number;
  total: number;
}

export function calculatePartPrice(
  input: PartPriceInput,
  config: PricingConfig = defaultPricingConfig
): PriceBreakdown {
  const areaCm2 = input.areaMm2 / 100;
  const areaCost = areaCm2 * config.perCm2Rate;
  const cutCost = input.cutLengthMm * config.perMmCutRate;

  const materialMult = config.materialMultipliers[input.material] ?? 1;
  const thicknessMult = config.thicknessMultipliers[input.thickness] ?? 1;
  const complexityMult = config.complexityMultiplier;

  let subtotalPerUnit =
    (areaCost + cutCost) * materialMult * thicknessMult * complexityMult;

  // Enforce minimum price per unit
  if (subtotalPerUnit < config.minimumPrice) {
    subtotalPerUnit = config.minimumPrice;
  }

  // Bulk discount
  let bulkDiscount = 0;
  if (input.quantity >= config.bulkDiscountThreshold) {
    bulkDiscount = (config.bulkDiscountPercent / 100) * subtotalPerUnit;
  }

  const pricePerUnit = subtotalPerUnit - bulkDiscount;
  const totalBeforeVat = pricePerUnit * input.quantity;
  const vat = totalBeforeVat * config.vatRate;
  const total = totalBeforeVat + vat;

  return {
    areaCost,
    cutCost,
    materialMultiplier: materialMult,
    thicknessMultiplier: thicknessMult,
    complexityMultiplier: complexityMult,
    subtotalPerUnit,
    bulkDiscount,
    pricePerUnit,
    totalBeforeVat,
    vat,
    total,
  };
}

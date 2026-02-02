import { describe, it, expect, vi } from "vitest";

// Mock Firebase before any imports that use it
vi.mock("@/lib/firebase/config", () => ({
  auth: {},
  db: {},
  storage: {},
}));

import { calculatePartPrice } from "../engine";
import type { PricingConfig } from "@/lib/firebase/db/pricing-config";

const testConfig: PricingConfig = {
  perCm2Rate: 0.05,
  perMmCutRate: 0.01,
  materialMultipliers: {
    steel: 1.0,
    stainless: 1.8,
    aluminum: 1.4,
  },
  thicknessMultipliers: {
    "1": 1.0,
    "2": 1.2,
    "3": 1.5,
  },
  complexityMultiplier: 1.0,
  bulkDiscountThreshold: 10,
  bulkDiscountPercent: 10,
  minimumPrice: 5.0,
  vatRate: 0.21,
};

describe("calculatePartPrice", () => {
  describe("basic calculations", () => {
    it("calculates area cost correctly", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000, // 100 cm²
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      // 100 cm² * 0.05 = 5.00
      expect(result.areaCost).toBeCloseTo(5.0);
    });

    it("calculates cut cost correctly", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 0,
          cutLengthMm: 500,
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      // 500 mm * 0.01 = 5.00
      expect(result.cutCost).toBeCloseTo(5.0);
    });

    it("combines area and cut costs", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000, // 100 cm² = 5.00
          cutLengthMm: 500, // 5.00
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      expect(result.subtotalPerUnit).toBeCloseTo(10.0);
    });
  });

  describe("multipliers", () => {
    it("applies material multiplier", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "stainless", // 1.8x
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      // 5.00 * 1.8 = 9.00
      expect(result.subtotalPerUnit).toBeCloseTo(9.0);
      expect(result.materialMultiplier).toBe(1.8);
    });

    it("applies thickness multiplier", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "3", // 1.5x
          quantity: 1,
        },
        testConfig
      );

      // 5.00 * 1.5 = 7.50
      expect(result.subtotalPerUnit).toBeCloseTo(7.5);
      expect(result.thicknessMultiplier).toBe(1.5);
    });

    it("defaults to 1x for unknown material", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "unobtanium",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      expect(result.materialMultiplier).toBe(1);
      expect(result.subtotalPerUnit).toBeCloseTo(5.0);
    });

    it("defaults to 1x for unknown thickness", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "99",
          quantity: 1,
        },
        testConfig
      );

      expect(result.thicknessMultiplier).toBe(1);
    });
  });

  describe("minimum price", () => {
    it("enforces minimum price when subtotal is too low", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 100, // 1 cm² = 0.05
          cutLengthMm: 10, // 0.10
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      // Raw subtotal would be 0.15, but minimum is 5.00
      expect(result.subtotalPerUnit).toBe(5.0);
    });

    it("does not apply minimum when subtotal exceeds it", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 20000, // 200 cm² = 10.00
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      expect(result.subtotalPerUnit).toBeCloseTo(10.0);
    });
  });

  describe("bulk discount", () => {
    it("applies bulk discount when quantity meets threshold", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 10, // Threshold is 10
        },
        testConfig
      );

      // Subtotal: 5.00, discount: 10% = 0.50
      expect(result.bulkDiscount).toBeCloseTo(0.5);
      expect(result.pricePerUnit).toBeCloseTo(4.5);
    });

    it("does not apply bulk discount below threshold", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 5,
        },
        testConfig
      );

      expect(result.bulkDiscount).toBe(0);
      expect(result.pricePerUnit).toBeCloseTo(5.0);
    });

    it("applies bulk discount above threshold", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 50,
        },
        testConfig
      );

      expect(result.bulkDiscount).toBeGreaterThan(0);
    });
  });

  describe("VAT calculation", () => {
    it("calculates VAT on total before VAT", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 1,
        },
        testConfig
      );

      // Total before VAT: 5.00, VAT: 21% = 1.05
      expect(result.totalBeforeVat).toBeCloseTo(5.0);
      expect(result.vat).toBeCloseTo(1.05);
      expect(result.total).toBeCloseTo(6.05);
    });

    it("calculates VAT for multiple quantities", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 10000,
          cutLengthMm: 0,
          material: "steel",
          thickness: "1",
          quantity: 5,
        },
        testConfig
      );

      // 5.00 * 5 = 25.00, VAT: 5.25
      expect(result.totalBeforeVat).toBeCloseTo(25.0);
      expect(result.vat).toBeCloseTo(5.25);
      expect(result.total).toBeCloseTo(30.25);
    });
  });

  describe("complex scenarios", () => {
    it("combines all factors correctly", () => {
      const result = calculatePartPrice(
        {
          areaMm2: 20000, // 200 cm² = 10.00
          cutLengthMm: 1000, // 10.00
          material: "stainless", // 1.8x
          thickness: "3", // 1.5x
          quantity: 15, // Bulk discount applies
        },
        testConfig
      );

      // Base: 10 + 10 = 20
      // With multipliers: 20 * 1.8 * 1.5 * 1.0 = 54.00
      // Bulk discount: 10% = 5.40
      // Price per unit: 48.60
      expect(result.subtotalPerUnit).toBeCloseTo(54.0);
      expect(result.bulkDiscount).toBeCloseTo(5.4);
      expect(result.pricePerUnit).toBeCloseTo(48.6);

      // Total: 48.60 * 15 = 729.00
      // VAT: 153.09
      expect(result.totalBeforeVat).toBeCloseTo(729.0);
      expect(result.vat).toBeCloseTo(153.09);
    });
  });
});

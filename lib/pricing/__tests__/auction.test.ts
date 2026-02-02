import { describe, it, expect } from "vitest";
import {
  calculateAuctionPrice,
  calculateDynamicDecayRate,
  calculateBusDriverPremium,
  type AuctionConfig,
} from "../auction";

describe("calculateAuctionPrice", () => {
  const baseConfig: AuctionConfig = {
    initialPrice: 100,
    floorPrice: 20,
    decayRate: 0.02,
    auctionStartTime: new Date("2026-01-01T00:00:00Z"),
  };

  describe("price decay", () => {
    it("returns initial price at start time", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-01T00:00:00Z")
      );

      expect(result.currentPrice).toBeCloseTo(100);
      expect(result.priceDropPercent).toBeCloseTo(0);
    });

    it("decays price over time", () => {
      // After 30 minutes with decay rate 0.02
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-01T00:30:00Z")
      );

      // P(t) = 20 + 80 * e^(-0.02 * 30) = 20 + 80 * e^(-0.6) ≈ 20 + 43.88 ≈ 63.88
      expect(result.currentPrice).toBeCloseTo(63.88, 1);
    });

    it("approaches floor price asymptotically", () => {
      // After many hours
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-02T00:00:00Z") // 24 hours later
      );

      // Should be very close to floor
      expect(result.currentPrice).toBeCloseTo(20, 0);
      expect(result.isAtFloor).toBe(true);
    });

    it("never goes below floor price", () => {
      // After very long time
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-06-01T00:00:00Z")
      );

      expect(result.currentPrice).toBeGreaterThanOrEqual(20);
    });
  });

  describe("before auction start", () => {
    it("returns initial price before auction starts", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2025-12-31T23:59:00Z") // 1 minute before
      );

      expect(result.currentPrice).toBe(100);
    });
  });

  describe("price drop calculations", () => {
    it("calculates correct price drop percentage", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-01T01:00:00Z") // 1 hour later
      );

      // Price should be around 44.19
      // Drop: (100 - 44.19) / 100 ≈ 55.81%
      expect(result.priceDropPercent).toBeGreaterThan(0);
      expect(result.priceDropPercent).toBeLessThan(100);
    });

    it("provides next drop time", () => {
      const now = new Date("2026-01-01T00:30:00Z");
      const result = calculateAuctionPrice(baseConfig, now);

      // Next drop should be 1 minute from now
      expect(result.nextDropTime.getTime()).toBe(now.getTime() + 60 * 1000);
    });

    it("calculates next drop amount", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-01T00:10:00Z")
      );

      expect(result.nextDropAmount).toBeGreaterThan(0);
    });

    it("shows zero next drop at floor", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-02T00:00:00Z")
      );

      expect(result.nextDropAmount).toBe(0);
      expect(result.isAtFloor).toBe(true);
    });
  });

  describe("time to floor", () => {
    it("provides estimated time to floor", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-01T00:00:00Z")
      );

      expect(result.timeToFloor).toBeGreaterThan(0);
    });

    it("returns 0 time to floor when at floor", () => {
      const result = calculateAuctionPrice(
        baseConfig,
        new Date("2026-01-02T00:00:00Z")
      );

      expect(result.timeToFloor).toBe(0);
    });
  });

  describe("validation", () => {
    it("throws error for non-positive decay rate", () => {
      const invalidConfig = { ...baseConfig, decayRate: 0 };

      expect(() => calculateAuctionPrice(invalidConfig)).toThrow(
        "Decay rate must be positive"
      );
    });

    it("throws error for negative decay rate", () => {
      const invalidConfig = { ...baseConfig, decayRate: -0.02 };

      expect(() => calculateAuctionPrice(invalidConfig)).toThrow(
        "Decay rate must be positive"
      );
    });

    it("throws error for negative initial price", () => {
      const invalidConfig = { ...baseConfig, initialPrice: -100 };

      expect(() => calculateAuctionPrice(invalidConfig)).toThrow(
        "Prices must be non-negative"
      );
    });

    it("throws error for negative floor price", () => {
      const invalidConfig = { ...baseConfig, floorPrice: -10 };

      expect(() => calculateAuctionPrice(invalidConfig)).toThrow(
        "Prices must be non-negative"
      );
    });

    it("throws error when floor exceeds initial", () => {
      const invalidConfig = { ...baseConfig, floorPrice: 150 };

      expect(() => calculateAuctionPrice(invalidConfig)).toThrow(
        "Floor price cannot exceed initial price"
      );
    });
  });

  describe("edge cases", () => {
    it("handles floor equal to initial (no decay)", () => {
      const config = {
        ...baseConfig,
        initialPrice: 50,
        floorPrice: 50,
      };
      const result = calculateAuctionPrice(
        config,
        new Date("2026-01-01T01:00:00Z")
      );

      expect(result.currentPrice).toBe(50);
      expect(result.isAtFloor).toBe(true);
    });

    it("handles very small decay rate", () => {
      const config = { ...baseConfig, decayRate: 0.001 };
      const result = calculateAuctionPrice(
        config,
        new Date("2026-01-01T00:30:00Z")
      );

      // Should decay very slowly
      expect(result.currentPrice).toBeGreaterThan(95);
    });

    it("handles very large decay rate", () => {
      const config = { ...baseConfig, decayRate: 1.0 };
      const result = calculateAuctionPrice(
        config,
        new Date("2026-01-01T00:05:00Z")
      );

      // Should decay very quickly
      expect(result.currentPrice).toBeLessThan(25);
    });
  });
});

describe("calculateDynamicDecayRate", () => {
  it("returns 2.5x rate for high inventory (>50)", () => {
    const rate = calculateDynamicDecayRate(60, 0.02);
    expect(rate).toBeCloseTo(0.05); // 0.02 * 2.5
  });

  it("returns 1.5x rate for moderate inventory (21-50)", () => {
    const rate = calculateDynamicDecayRate(30, 0.02);
    expect(rate).toBeCloseTo(0.03); // 0.02 * 1.5
  });

  it("returns base rate for normal inventory (5-20)", () => {
    const rate = calculateDynamicDecayRate(10, 0.02);
    expect(rate).toBeCloseTo(0.02);
  });

  it("returns 0.5x rate for low inventory (<5)", () => {
    const rate = calculateDynamicDecayRate(3, 0.02);
    expect(rate).toBeCloseTo(0.01); // 0.02 * 0.5
  });

  it("handles zero inventory", () => {
    const rate = calculateDynamicDecayRate(0, 0.02);
    expect(rate).toBeCloseTo(0.01); // 0.02 * 0.5 (conservative)
  });

  it("handles negative inventory (clamps to 0)", () => {
    const rate = calculateDynamicDecayRate(-5, 0.02);
    expect(rate).toBeCloseTo(0.01);
  });

  it("uses default base rate when not specified", () => {
    const rate = calculateDynamicDecayRate(10);
    expect(rate).toBeCloseTo(0.02);
  });

  it("handles very small base rate", () => {
    const rate = calculateDynamicDecayRate(100, 0.0001);
    expect(rate).toBeGreaterThan(0);
  });
});

describe("calculateBusDriverPremium", () => {
  it("calculates premium for 50% utilization", () => {
    // 50% utilization, 100€ sheet cost
    // Remaining: 50%, premium: 100 * 0.5 * 1.2 = 60
    const premium = calculateBusDriverPremium(0.5, 100);
    expect(premium).toBeCloseTo(60);
  });

  it("calculates premium for empty sheet (0% utilization)", () => {
    // 100% remaining, 100 * 1.0 * 1.2 = 120
    const premium = calculateBusDriverPremium(0, 100);
    expect(premium).toBeCloseTo(120);
  });

  it("returns 0 for fully utilized sheet", () => {
    const premium = calculateBusDriverPremium(1.0, 100);
    expect(premium).toBe(0);
  });

  it("handles utilization above 100% (clamps to 1)", () => {
    const premium = calculateBusDriverPremium(1.5, 100);
    expect(premium).toBe(0);
  });

  it("handles negative utilization (clamps to 0)", () => {
    const premium = calculateBusDriverPremium(-0.2, 100);
    expect(premium).toBeCloseTo(120); // Treated as 0%
  });

  it("handles negative sheet cost (clamps to 0)", () => {
    const premium = calculateBusDriverPremium(0.5, -100);
    expect(premium).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const premium = calculateBusDriverPremium(0.333, 100);
    // (1 - 0.333) * 100 * 1.2 = 80.04
    expect(premium).toBe(Math.round(100 * 0.667 * 1.2 * 100) / 100);
  });

  it("calculates realistic scenario", () => {
    // 75% utilized, 250€ sheet
    // Remaining: 25%, premium: 250 * 0.25 * 1.2 = 75
    const premium = calculateBusDriverPremium(0.75, 250);
    expect(premium).toBeCloseTo(75);
  });
});

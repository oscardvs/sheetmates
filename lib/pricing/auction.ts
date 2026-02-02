export interface AuctionConfig {
  initialPrice: number;
  floorPrice: number;
  decayRate: number; // Lambda in exponential decay (must be > 0)
  auctionStartTime: Date;
}

export interface AuctionPriceResult {
  currentPrice: number;
  priceDropPercent: number;
  nextDropTime: Date;
  nextDropAmount: number;
  isAtFloor: boolean;
  timeToFloor: number; // milliseconds until price reaches floor
}

/**
 * Calculate current Dutch Auction price using exponential decay
 * P(t) = FloorPrice + (InitialPrice - FloorPrice) * e^(-λt)
 *
 * @throws Error if config has invalid values
 */
export function calculateAuctionPrice(
  config: AuctionConfig,
  currentTime: Date = new Date()
): AuctionPriceResult {
  // Validate inputs
  if (config.decayRate <= 0) {
    throw new Error("Decay rate must be positive");
  }
  if (config.initialPrice < 0 || config.floorPrice < 0) {
    throw new Error("Prices must be non-negative");
  }
  if (config.floorPrice > config.initialPrice) {
    throw new Error("Floor price cannot exceed initial price");
  }

  const elapsed = currentTime.getTime() - config.auctionStartTime.getTime();
  const elapsedMinutes = Math.max(0, elapsed / (60 * 1000));

  const priceDelta = config.initialPrice - config.floorPrice;
  const decayFactor = Math.exp(-config.decayRate * elapsedMinutes);
  const currentPrice = config.floorPrice + priceDelta * decayFactor;

  // Round to 2 decimal places, ensure we don't go below floor
  const roundedPrice = Math.max(
    config.floorPrice,
    Math.round(currentPrice * 100) / 100
  );

  const isAtFloor = roundedPrice <= config.floorPrice;

  // Calculate next drop (1 minute from now)
  const nextMinute = elapsedMinutes + 1;
  const nextDecay = Math.exp(-config.decayRate * nextMinute);
  const nextPrice = config.floorPrice + priceDelta * nextDecay;
  const nextRoundedPrice = Math.max(
    config.floorPrice,
    Math.round(nextPrice * 100) / 100
  );
  const nextDropAmount = Math.max(0, roundedPrice - nextRoundedPrice);

  // Calculate time to floor based on current decay state
  // When decayFactor reaches 0.01 (1% remaining), we're essentially at floor
  let timeToFloor = 0;
  if (!isAtFloor && decayFactor > 0.01) {
    // Solve for when e^(-λt) = 0.01 from current state
    // Additional minutes needed: t = ln(decayFactor / 0.01) / λ
    const additionalMinutes = Math.log(decayFactor / 0.01) / config.decayRate;
    timeToFloor = Math.max(0, additionalMinutes * 60 * 1000);
  }

  // Safe priceDropPercent calculation
  const priceDropPercent =
    config.initialPrice > 0
      ? ((config.initialPrice - roundedPrice) / config.initialPrice) * 100
      : 0;

  return {
    currentPrice: roundedPrice,
    priceDropPercent,
    nextDropTime: new Date(currentTime.getTime() + 60 * 1000),
    nextDropAmount: isAtFloor ? 0 : nextDropAmount,
    isAtFloor,
    timeToFloor,
  };
}

/**
 * Calculate decay rate based on inventory levels
 * High inventory = faster decay (aggressive clearing)
 * Low inventory = slower decay (maximize margin)
 *
 * @param materialInventoryCount - Number of sheets in inventory (must be >= 0)
 * @param baseRate - Base decay rate, default 0.02 (2% per minute)
 * @returns Adjusted decay rate
 */
export function calculateDynamicDecayRate(
  materialInventoryCount: number,
  baseRate: number = 0.02
): number {
  // Clamp to non-negative
  const count = Math.max(0, materialInventoryCount);
  const rate = Math.max(0.001, baseRate); // Minimum rate to prevent division issues

  if (count > 50) {
    return rate * 2.5; // Aggressive: 5% per interval
  } else if (count > 20) {
    return rate * 1.5; // Moderate: 3% per interval
  } else if (count < 5) {
    return rate * 0.5; // Conservative: 1% per interval
  }
  return rate; // Default: 2% per interval
}

/**
 * Calculate the "Bus Driver" premium to force immediate production
 * User pays for remaining empty space on sheet + 20% urgency fee
 *
 * @param currentUtilization - Sheet utilization ratio (0-1)
 * @param sheetBaseCost - Base cost of the sheet in currency
 * @returns Premium amount to pay for immediate production
 */
export function calculateBusDriverPremium(
  currentUtilization: number,
  sheetBaseCost: number
): number {
  // Clamp utilization to valid range
  const utilization = Math.max(0, Math.min(1, currentUtilization));
  const cost = Math.max(0, sheetBaseCost);

  const remainingSpace = 1 - utilization;
  // Premium is cost of remaining space + 20% urgency fee
  return Math.round(cost * remainingSpace * 1.2 * 100) / 100;
}

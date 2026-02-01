export interface AuctionConfig {
  initialPrice: number;
  floorPrice: number;
  decayRate: number; // Lambda in exponential decay
  auctionStartTime: Date;
}

export interface AuctionPriceResult {
  currentPrice: number;
  priceDropPercent: number;
  nextDropTime: Date;
  nextDropAmount: number;
  isAtFloor: boolean;
  timeToFloor: number; // milliseconds
}

/**
 * Calculate current Dutch Auction price using exponential decay
 * P(t) = FloorPrice + (InitialPrice - FloorPrice) * e^(-λt)
 */
export function calculateAuctionPrice(
  config: AuctionConfig,
  currentTime: Date = new Date()
): AuctionPriceResult {
  const elapsed = currentTime.getTime() - config.auctionStartTime.getTime();
  const elapsedMinutes = elapsed / (60 * 1000);

  const priceDelta = config.initialPrice - config.floorPrice;
  const decayFactor = Math.exp(-config.decayRate * elapsedMinutes);
  const currentPrice = config.floorPrice + priceDelta * decayFactor;

  // Round to 2 decimal places
  const roundedPrice = Math.max(
    config.floorPrice,
    Math.round(currentPrice * 100) / 100
  );

  const isAtFloor = roundedPrice <= config.floorPrice;

  // Calculate next drop (1 minute from now)
  const nextMinute = elapsedMinutes + 1;
  const nextDecay = Math.exp(-config.decayRate * nextMinute);
  const nextPrice = config.floorPrice + priceDelta * nextDecay;
  const nextDropAmount = Math.round((currentPrice - nextPrice) * 100) / 100;

  // Time to floor (when price is within 1% of floor)
  // Solve: 0.01 * (Initial - Floor) = (Initial - Floor) * e^(-λt)
  // t = -ln(0.01) / λ
  const timeToFloorMinutes = Math.log(100) / config.decayRate;
  const timeToFloor = Math.max(0, timeToFloorMinutes * 60 * 1000 - elapsed);

  return {
    currentPrice: roundedPrice,
    priceDropPercent:
      ((config.initialPrice - roundedPrice) / config.initialPrice) * 100,
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
 */
export function calculateDynamicDecayRate(
  materialInventoryCount: number,
  baseRate: number = 0.02
): number {
  if (materialInventoryCount > 50) {
    return baseRate * 2.5; // Aggressive: 5% per interval
  } else if (materialInventoryCount > 20) {
    return baseRate * 1.5; // Moderate: 3% per interval
  } else if (materialInventoryCount < 5) {
    return baseRate * 0.5; // Conservative: 1% per interval
  }
  return baseRate; // Default: 2% per interval
}

/**
 * Calculate the "Bus Driver" premium to force immediate production
 * User pays for remaining empty space on sheet
 */
export function calculateBusDriverPremium(
  currentUtilization: number,
  sheetBaseCost: number
): number {
  const remainingSpace = 1 - currentUtilization;
  // Premium is cost of remaining space + 20% urgency fee
  return sheetBaseCost * remainingSpace * 1.2;
}

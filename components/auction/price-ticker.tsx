"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { calculateAuctionPrice, type AuctionConfig } from "@/lib/pricing/auction";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendDownIcon, ClockIcon, FireIcon } from "@phosphor-icons/react";

interface PriceTickerProps {
  config: AuctionConfig;
  className?: string;
}

export function PriceTicker({ config, className }: PriceTickerProps) {
  const t = useTranslations("auction");
  const [priceResult, setPriceResult] = useState(() =>
    calculateAuctionPrice(config)
  );

  // Memoize config values for stable dependencies
  const configKey = useMemo(
    () =>
      `${config.initialPrice}-${config.floorPrice}-${config.decayRate}-${config.auctionStartTime.getTime()}`,
    [config.initialPrice, config.floorPrice, config.decayRate, config.auctionStartTime]
  );

  // Update price every second
  useEffect(() => {
    // Initial calculation
    setPriceResult(calculateAuctionPrice(config));

    const interval = setInterval(() => {
      setPriceResult(calculateAuctionPrice(config));
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- configKey captures all config changes
  }, [configKey]);

  // Calculate countdown from actual nextDropTime
  const timeToNextDrop = Math.max(
    0,
    Math.ceil((priceResult.nextDropTime.getTime() - Date.now()) / 1000)
  );

  // Safe progress calculation (avoid division by zero)
  const priceRange = config.initialPrice - config.floorPrice;
  const progressValue =
    priceRange > 0
      ? ((priceResult.currentPrice - config.floorPrice) / priceRange) * 100
      : 100;

  return (
    <Card className={`border-zinc-800 bg-zinc-900 ${className ?? ""}`}>
      <CardContent className="p-4">
        {/* Current Price */}
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-3xl font-bold text-emerald-500">
            €{priceResult.currentPrice.toFixed(2)}
          </span>
          {priceResult.isAtFloor ? (
            <Badge variant="secondary">{t("floorReached")}</Badge>
          ) : (
            <Badge variant="outline" className="font-mono">
              <TrendDownIcon className="mr-1 h-3 w-3" />
              -{priceResult.priceDropPercent.toFixed(1)}%
            </Badge>
          )}
        </div>

        {/* Price range bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€{config.floorPrice.toFixed(2)}</span>
            <span>€{config.initialPrice.toFixed(2)}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Next drop countdown */}
        {!priceResult.isAtFloor && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">{t("nextDrop")}:</span>
            <span className="font-mono">{timeToNextDrop}s</span>
            <span className="text-muted-foreground">
              (-€{priceResult.nextDropAmount.toFixed(2)})
            </span>
          </div>
        )}

        {/* Urgency indicator when close to floor */}
        {priceResult.timeToFloor < 30 * 60 * 1000 && !priceResult.isAtFloor && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-500">
            <FireIcon className="h-4 w-4" />
            <span>{t("priceDropping")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

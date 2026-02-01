"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UsersIcon, RocketIcon, TargetIcon } from "@phosphor-icons/react";

interface ViabilityMeterProps {
  currentUtilization: number;
  targetUtilization?: number;
  participantCount: number;
  busDriverPremium: number;
  onBecomeDriver?: () => void;
  className?: string;
}

export function ViabilityMeter({
  currentUtilization,
  targetUtilization = 0.85,
  participantCount,
  busDriverPremium,
  onBecomeDriver,
  className,
}: ViabilityMeterProps) {
  const t = useTranslations("viability");

  const utilizationPercent = currentUtilization * 100;
  const targetPercent = targetUtilization * 100;
  const isViable = currentUtilization >= targetUtilization;

  // Determine status color
  const getStatusColor = () => {
    if (isViable) return "bg-emerald-500";
    if (utilizationPercent >= 70) return "bg-amber-500";
    return "bg-zinc-500";
  };

  return (
    <Card className={`border-zinc-800 bg-zinc-900 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TargetIcon className="h-4 w-4" />
          {t("sheetViability")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-mono">{utilizationPercent.toFixed(1)}%</span>
            <span className="text-muted-foreground">
              {t("target")}: {targetPercent}%
            </span>
          </div>
          <div className="relative">
            <Progress value={utilizationPercent} className="h-4" />
            {/* Target marker */}
            <div
              className="absolute top-0 h-4 w-0.5 bg-white"
              style={{ left: `${targetPercent}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm">
            {isViable ? t("readyToCut") : t("waitingForParticipants")}
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UsersIcon className="h-4 w-4" />
          <span>
            {participantCount} {t("participants")}
          </span>
        </div>

        {/* Bus Driver option */}
        {!isViable && onBecomeDriver && (
          <div className="border-t border-zinc-800 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {t("busDriverDescription")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onBecomeDriver}
            >
              <RocketIcon className="mr-2 h-4 w-4" />
              {t("forceRun")} (+€{busDriverPremium.toFixed(2)})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

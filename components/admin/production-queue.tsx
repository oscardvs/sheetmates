"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductionQueue,
  updateSheetStatus,
} from "@/lib/firebase/db/production";
import type { SheetDoc } from "@/lib/firebase/db/sheets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  QueueIcon,
  PlayIcon,
  CheckCircleIcon,
  ScissorsIcon,
} from "@phosphor-icons/react";

export function ProductionQueue() {
  const t = useTranslations("admin.queue");
  const queryClient = useQueryClient();

  const { data: sheets, isLoading } = useQuery({
    queryKey: ["productionQueue"],
    queryFn: getProductionQueue,
    refetchInterval: 30000, // Refresh every 30s
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cutting" | "done" }) =>
      updateSheetStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionQueue"] });
      toast.success(t("statusUpdated"));
    },
    onError: () => {
      toast.error(t("updateError"));
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  const fullSheets = sheets?.filter((s) => s.status === "full") ?? [];
  const cuttingSheets = sheets?.filter((s) => s.status === "cutting") ?? [];

  return (
    <div className="space-y-6">
      {/* Cutting in Progress */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ScissorsIcon className="h-5 w-5 text-amber-500" />
          {t("inProgress")} ({cuttingSheets.length})
        </h2>
        {cuttingSheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCutting")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cuttingSheets.map((sheet) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                onComplete={() =>
                  statusMutation.mutate({ id: sheet.id, status: "done" })
                }
                loading={statusMutation.isPending}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ready to Cut */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <QueueIcon className="h-5 w-5 text-emerald-500" />
          {t("readyToCut")} ({fullSheets.length})
        </h2>
        {fullSheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noReady")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fullSheets.map((sheet) => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                onStart={() =>
                  statusMutation.mutate({ id: sheet.id, status: "cutting" })
                }
                loading={statusMutation.isPending}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface SheetCardProps {
  sheet: SheetDoc;
  onStart?: () => void;
  onComplete?: () => void;
  loading: boolean;
  t: (key: string) => string;
}

function SheetCard({ sheet, onStart, onComplete, loading, t }: SheetCardProps) {
  const statusColor =
    sheet.status === "cutting" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm">
            {sheet.id.slice(0, 8)}
          </CardTitle>
          <Badge variant="outline" className={statusColor}>
            {t(sheet.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t("material")}:</span>
            <span className="ml-1 capitalize">{sheet.material}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("thickness")}:</span>
            <span className="ml-1">{sheet.thickness}mm</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("size")}:</span>
            <span className="ml-1 font-mono text-xs">
              {sheet.width}x{sheet.height}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("parts")}:</span>
            <span className="ml-1">{sheet.placements.length}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{t("utilization")}</span>
            <span className="font-mono">
              {(sheet.utilization * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={sheet.utilization * 100} className="h-2" />
        </div>

        {onStart && (
          <Button
            size="sm"
            className="w-full"
            onClick={onStart}
            disabled={loading}
          >
            <PlayIcon className="mr-2 h-4 w-4" />
            {t("startCutting")}
          </Button>
        )}

        {onComplete && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onComplete}
            disabled={loading}
          >
            <CheckCircleIcon className="mr-2 h-4 w-4" />
            {t("markComplete")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

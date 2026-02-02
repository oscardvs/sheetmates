"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InjectSheetForm } from "@/components/admin/inject-sheet-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrivesIcon, StackIcon } from "@phosphor-icons/react";
import type { SheetDoc } from "@/lib/firebase/db/sheets";

async function getOpenSheets(): Promise<SheetDoc[]> {
  const sheetsRef = collection(db, "sheets");
  const q = query(sheetsRef, where("status", "in", ["open", "full"]));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SheetDoc[];
}

export default function InventoryPage() {
  const t = useTranslations("admin");

  const { data: sheets, isLoading } = useQuery({
    queryKey: ["inventory-sheets"],
    queryFn: getOpenSheets,
    refetchInterval: 30000,
  });

  const openSheets = sheets?.filter((s) => s.status === "open") ?? [];
  const fullSheets = sheets?.filter((s) => s.status === "full") ?? [];

  // Group by material
  const sheetsByMaterial = openSheets.reduce(
    (acc, sheet) => {
      const key = `${sheet.material}-${sheet.thickness}mm`;
      if (!acc[key]) {
        acc[key] = { material: sheet.material, thickness: sheet.thickness, count: 0 };
      }
      acc[key].count++;
      return acc;
    },
    {} as Record<string, { material: string; thickness: number; count: number }>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <HardDrivesIcon className="h-5 w-5 text-blue-500" weight="duotone" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Sheet Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage available sheets for community nesting</p>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Sheets
            </CardTitle>
            <StackIcon className="h-5 w-5 text-emerald-500" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">{openSheets.length}</p>
            <p className="text-xs text-muted-foreground">Available for nesting</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Full Sheets
            </CardTitle>
            <StackIcon className="h-5 w-5 text-amber-500" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">{fullSheets.length}</p>
            <p className="text-xs text-muted-foreground">Ready for cutting</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory
            </CardTitle>
            <HardDrivesIcon className="h-5 w-5 text-primary" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">{sheets?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active sheets</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Inventory by Material */}
      {Object.keys(sheetsByMaterial).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Current Stock by Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sheetsByMaterial).map(([key, data]) => (
                <Badge key={key} variant="outline" className="font-mono text-sm">
                  {data.material} {data.thickness}mm: {data.count} sheets
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inject New Sheets */}
      <div>
        <h2 className="mb-4 font-mono text-lg font-semibold text-foreground">Add New Sheets</h2>
        <InjectSheetForm />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { deleteSheet, type SheetDoc } from "@/lib/firebase/db/sheets";
import { printQRLabel } from "@/lib/qr/print-label";
import { InjectSheetForm } from "@/components/admin/inject-sheet-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HardDrivesIcon,
  StackIcon,
  TrashIcon,
  QrCodeIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [sheetToDelete, setSheetToDelete] = useState<SheetDoc | null>(null);

  const { data: sheets, isLoading } = useQuery({
    queryKey: ["inventory-sheets"],
    queryFn: getOpenSheets,
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-sheets"] });
      toast.success(t("inventory.deleteSuccess"));
      setSheetToDelete(null);
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      toast.error(t("inventory.deleteError"));
    },
  });

  const handlePrintLabel = async (sheet: SheetDoc) => {
    try {
      await printQRLabel({
        qrCode: (sheet as SheetDoc & { qrCode?: string }).qrCode ?? sheet.id,
        sheetId: sheet.id,
        material: sheet.material,
        thickness: sheet.thickness,
        dimensions: `${sheet.width}mm × ${sheet.height}mm`,
      });
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Failed to print label");
    }
  };

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

      {/* Sheet List */}
      {sheets && sheets.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">All Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between rounded border border-border bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        sheet.status === "open"
                          ? "default"
                          : sheet.status === "full"
                            ? "secondary"
                            : "outline"
                      }
                      className="font-mono text-xs"
                    >
                      {sheet.status}
                    </Badge>
                    <div className="font-mono text-sm">
                      <span className="font-medium">{sheet.material}</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span>{sheet.thickness}mm</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="text-muted-foreground">
                        {sheet.width}×{sheet.height}mm
                      </span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="text-muted-foreground">
                        {Math.round(sheet.utilization * 100)}% used
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrintLabel(sheet)}
                      title="Print QR Label"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSheetToDelete(sheet)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Delete Sheet"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!sheetToDelete}
        onOpenChange={(open) => !open && setSheetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inventory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("inventory.deleteDescription", {
                material: sheetToDelete?.material ?? "",
                thickness: sheetToDelete?.thickness ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("inventory.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sheetToDelete && deleteMutation.mutate(sheetToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t("inventory.deleting") : t("inventory.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

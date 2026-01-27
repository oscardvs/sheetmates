"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NestingControlsProps {
  sheetWidth: number;
  sheetHeight: number;
  material: string;
  kerf: number;
  utilization: number;
  partsPlaced: number;
  onSheetWidthChange: (v: number) => void;
  onSheetHeightChange: (v: number) => void;
  onMaterialChange: (v: string) => void;
  onKerfChange: (v: number) => void;
  onRunNesting: () => void;
  loading?: boolean;
}

export function NestingControls({
  sheetWidth,
  sheetHeight,
  material,
  kerf,
  utilization,
  partsPlaced,
  onSheetWidthChange,
  onSheetHeightChange,
  onMaterialChange,
  onKerfChange,
  onRunNesting,
  loading,
}: NestingControlsProps) {
  const t = useTranslations("nesting");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{t("title")}</h3>

      <div className="space-y-2">
        <Label>{t("selectMaterial")}</Label>
        <Select value={material} onValueChange={onMaterialChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="steel">Steel</SelectItem>
            <SelectItem value="stainless">Stainless Steel</SelectItem>
            <SelectItem value="aluminum">Aluminum</SelectItem>
            <SelectItem value="copper">Copper</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>{t("sheetWidth")}</Label>
          <Input
            type="number"
            value={sheetWidth}
            onChange={(e) => onSheetWidthChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>{t("sheetHeight")}</Label>
          <Input
            type="number"
            value={sheetHeight}
            onChange={(e) => onSheetHeightChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>{t("kerf")}</Label>
        <Input
          type="number"
          step="0.1"
          value={kerf}
          onChange={(e) => onKerfChange(Number(e.target.value))}
        />
      </div>

      <Button onClick={onRunNesting} className="w-full" disabled={loading}>
        {t("runNesting")}
      </Button>

      <div className="space-y-1 rounded-lg border p-3 text-sm">
        <p>
          {t("utilization")}: <strong>{(utilization * 100).toFixed(1)}%</strong>
        </p>
        <p>
          {t("partsPlaced")}: <strong>{partsPlaced}</strong>
        </p>
      </div>
    </div>
  );
}

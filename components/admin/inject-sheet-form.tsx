"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { injectSheet, type InjectedSheet } from "@/lib/firebase/db/inject-sheet";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { PlusIcon, QrCodeIcon } from "@phosphor-icons/react";

const MATERIALS = ["steel", "stainless", "aluminum", "copper"];
const THICKNESSES = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

interface FormData {
  width: number;
  height: number;
  material: string;
  thickness: number;
  quantity: number;
  initialPrice: number;
  floorPrice: number;
}

export function InjectSheetForm() {
  const t = useTranslations("admin.inject");
  const [loading, setLoading] = useState(false);
  const [injectedSheets, setInjectedSheets] = useState<InjectedSheet[]>([]);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      width: 3000,
      height: 1500,
      material: "steel",
      thickness: 3,
      quantity: 1,
      initialPrice: 100,
      floorPrice: 20,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const results = await injectSheet(data);
      setInjectedSheets(results);
      toast.success(t("success", { count: results.length }));
    } catch (error) {
      console.error("Injection failed:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("width")}</Label>
                <Input
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("height")}</Label>
                <Input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Material */}
            <div className="space-y-2">
              <Label>{t("material")}</Label>
              <Select
                value={watch("material")}
                onValueChange={(v) => setValue("material", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thickness */}
            <div className="space-y-2">
              <Label>{t("thickness")}</Label>
              <Select
                value={watch("thickness").toString()}
                onValueChange={(v) => setValue("thickness", parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THICKNESSES.map((th) => (
                    <SelectItem key={th} value={th.toString()}>
                      {th} mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("initialPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("initialPrice", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("floorPrice")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("floorPrice", { valueAsNumber: true })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("injecting") : t("inject")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Code results */}
      {injectedSheets.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              {t("injectedSheets")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {injectedSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between rounded border border-zinc-800 p-2"
                >
                  <code className="text-xs">{sheet.qrCode}</code>
                  <Button variant="ghost" size="sm">
                    {t("printLabel")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

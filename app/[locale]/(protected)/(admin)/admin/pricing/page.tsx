"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPricingConfig,
  setPricingConfig,
  type PricingConfig,
  defaultPricingConfig,
} from "@/lib/firebase/db/pricing-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CurrencyDollarIcon, SpinnerGapIcon } from "@phosphor-icons/react";

export default function AdminPricingPage() {
  const t = useTranslations("admin");
  const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPricingConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      await setPricingConfig(config);
      toast.success("Pricing configuration saved");
    } catch {
      toast.error("Failed to save pricing configuration");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <SpinnerGapIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" weight="duotone" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t("pricingConfig")}</h1>
          <p className="text-sm text-muted-foreground">Configure pricing rates and multipliers</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Base Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Per cm² rate (€)</Label>
              <Input
                type="number"
                step="0.001"
                value={config.perCm2Rate}
                onChange={(e) =>
                  setConfig({ ...config, perCm2Rate: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Per mm cut rate (€)</Label>
              <Input
                type="number"
                step="0.001"
                value={config.perMmCutRate}
                onChange={(e) =>
                  setConfig({ ...config, perMmCutRate: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum price (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.minimumPrice}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    minimumPrice: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>VAT rate (%)</Label>
              <Input
                type="number"
                step="1"
                value={config.vatRate * 100}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    vatRate: Number(e.target.value) / 100,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Complexity multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={config.complexityMultiplier}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    complexityMultiplier: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bulk discount threshold (qty)</Label>
              <Input
                type="number"
                value={config.bulkDiscountThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bulkDiscountThreshold: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bulk discount (%)</Label>
              <Input
                type="number"
                value={config.bulkDiscountPercent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bulkDiscountPercent: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Material Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.materialMultipliers).map(([mat, val]) => (
            <div key={mat} className="flex items-center gap-4">
              <Label className="w-24 capitalize">{mat}</Label>
              <Input
                type="number"
                step="0.1"
                value={val}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    materialMultipliers: {
                      ...config.materialMultipliers,
                      [mat]: Number(e.target.value),
                    },
                  })
                }
                className="w-32"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Thickness Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.thicknessMultipliers).map(([thick, val]) => (
            <div key={thick} className="flex items-center gap-4">
              <Label className="w-24">{thick} mm</Label>
              <Input
                type="number"
                step="0.1"
                value={val}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    thicknessMultipliers: {
                      ...config.thicknessMultipliers,
                      [thick]: Number(e.target.value),
                    },
                  })
                }
                className="w-32"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} size="lg">
        {t("save")}
      </Button>
    </div>
  );
}

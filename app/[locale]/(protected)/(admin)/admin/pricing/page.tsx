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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("pricingConfig")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Base Rates</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Material Multipliers</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Thickness Multipliers</CardTitle>
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

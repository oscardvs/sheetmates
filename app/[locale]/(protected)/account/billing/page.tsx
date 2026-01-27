"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  const t = useTranslations("account");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("billing")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("billingAddress")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Company name (optional)" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input placeholder="Street address" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input placeholder="Postal code" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input placeholder="Country" />
            </div>
            <div className="space-y-2">
              <Label>{t("vatId")}</Label>
              <Input placeholder="CZ12345678" />
            </div>
          </div>
          <Button>{t("title") === "Account" ? "Save" : t("title")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useTranslations } from "next-intl";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { defaultPricingConfig } from "@/lib/firebase/db/pricing-config";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const config = defaultPricingConfig;

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto max-w-4xl flex-1 px-4 py-12">
          <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Base Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("perArea")}</span>
                  <span>€{config.perCm2Rate.toFixed(3)}/cm²</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("perCut")}</span>
                  <span>€{config.perMmCutRate.toFixed(3)}/mm</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("minimum")}</span>
                  <span>€{config.minimumPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("vat")}</span>
                  <span>{(config.vatRate * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("material")} Multipliers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("material")}</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(config.materialMultipliers).map(
                      ([mat, mult]) => (
                        <TableRow key={mat}>
                          <TableCell className="capitalize">{mat}</TableCell>
                          <TableCell className="text-right">
                            x{(mult as number).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t("thickness")} Multipliers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("thickness")} (mm)</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(config.thicknessMultipliers).map(
                      ([thick, mult]) => (
                        <TableRow key={thick}>
                          <TableCell>{thick} mm</TableCell>
                          <TableCell className="text-right">
                            x{(mult as number).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

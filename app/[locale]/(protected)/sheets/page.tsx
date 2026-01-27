"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllSheets, type SheetDoc } from "@/lib/firebase/db/sheets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SheetsPage() {
  const t = useTranslations("sheets");
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSheets()
      .then(setSheets)
      .finally(() => setLoading(false));
  }, []);

  const statusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "secondary" as const;
      case "full":
        return "default" as const;
      case "cutting":
        return "outline" as const;
      case "done":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">{t("noSheets")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {sheets.length === 0 ? (
        <p className="text-muted-foreground">{t("noSheets")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dimensions")}</TableHead>
              <TableHead>{t("material")}</TableHead>
              <TableHead>{t("utilization")}</TableHead>
              <TableHead>{t("placements")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheets.map((sheet) => (
              <TableRow key={sheet.id}>
                <TableCell>
                  {sheet.width} x {sheet.height} mm
                </TableCell>
                <TableCell>{sheet.material}</TableCell>
                <TableCell>
                  {(sheet.utilization * 100).toFixed(1)}%
                </TableCell>
                <TableCell>{sheet.placements.length}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(sheet.status)}>
                    {sheet.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/sheets/${sheet.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

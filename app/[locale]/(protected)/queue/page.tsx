"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getPartsByUser,
  updatePart,
  type PartDoc,
} from "@/lib/firebase/db/parts";
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

export default function QueuePage() {
  const t = useTranslations("queue");
  const { user } = useAuth();
  const [parts, setParts] = useState<PartDoc[]>([]);

  useEffect(() => {
    if (user) {
      getPartsByUser(user.uid).then(setParts);
    }
  }, [user]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary" as const;
      case "nested":
        return "outline" as const;
      case "cut":
        return "default" as const;
      case "shipped":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("pending");
      case "nested":
        return t("nested");
      case "cut":
        return t("cut");
      case "shipped":
        return t("shipped");
      default:
        return status;
    }
  };

  async function handleDelete(id: string) {
    await updatePart(id, { status: "pending" });
    if (user) {
      const updated = await getPartsByUser(user.uid);
      setParts(updated);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {parts.length === 0 ? (
        <p className="text-muted-foreground">No parts in queue.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("partName")}</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-medium">{part.fileName}</TableCell>
                <TableCell>
                  {part.boundingBox.width.toFixed(1)} x{" "}
                  {part.boundingBox.height.toFixed(1)} mm
                </TableCell>
                <TableCell>{part.quantity}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(part.status)}>
                    {statusLabel(part.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {part.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(part.id)}
                    >
                      Reset
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

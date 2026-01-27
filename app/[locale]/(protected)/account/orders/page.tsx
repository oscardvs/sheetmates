"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { getOrdersByUser, type OrderDoc } from "@/lib/firebase/db/orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const t = useTranslations("account");
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  useEffect(() => {
    if (user) {
      getOrdersByUser(user.uid).then(setOrders);
    }
  }, [user]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const;
      case "processing":
        return "outline" as const;
      case "shipped":
        return "default" as const;
      case "delivered":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("orderHistory")}</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">{t("noOrders")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.id.slice(0, 8)}
                </TableCell>
                <TableCell>{order.items.length} parts</TableCell>
                <TableCell>€{order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

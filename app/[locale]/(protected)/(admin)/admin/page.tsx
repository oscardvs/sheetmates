"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAllOrders, type OrderDoc } from "@/lib/firebase/db/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  CurrencyDollarIcon,
  ReceiptIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";

export default function AdminPage() {
  const t = useTranslations("admin");
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  useEffect(() => {
    getAllOrders().then(setOrders);
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status !== "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const paidOrders = orders.filter((o) => o.status !== "pending");

  // Simple monthly chart data
  const chartData = paidOrders.reduce(
    (acc, order) => {
      const month = "Recent";
      const existing = acc.find((d) => d.month === month);
      if (existing) {
        existing.revenue += order.total;
      } else {
        acc.push({ month, revenue: order.total });
      }
      return acc;
    },
    [] as { month: string; revenue: number }[]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ChartBarIcon className="h-5 w-5 text-primary" weight="duotone" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("overview")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("revenue")}
            </CardTitle>
            <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">€{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ReceiptIcon className="h-5 w-5 text-blue-500" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Orders
            </CardTitle>
            <CheckCircleIcon className="h-5 w-5 text-primary" weight="duotone" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold text-foreground">{paidOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ChartBarIcon className="h-5 w-5 text-primary" weight="duotone" />
              {t("revenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="oklch(0.59 0.14 242)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ReceiptIcon className="h-5 w-5 text-primary" weight="duotone" />
            {t("recentOrders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 20).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {order.userId.slice(0, 8)}
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>€{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "paid" ? "default" : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

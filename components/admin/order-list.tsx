"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllOrders,
  updateOrderStatus,
  type OrderDoc,
  type OrderStatus,
} from "@/lib/firebase/db/orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PackageIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-zinc-500",
  paid: "bg-blue-500",
  processing: "bg-amber-500",
  shipped: "bg-purple-500",
  delivered: "bg-emerald-500",
};

export function OrderList() {
  const t = useTranslations("admin.orders");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getAllOrders,
    refetchInterval: 60000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(t("statusUpdated"));
    },
    onError: () => {
      toast.error(t("updateError"));
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      search === "" ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      order.userId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            {t("title")} ({filteredOrders?.length ?? 0})
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders?.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderId")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead>{t("subtotal")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.userEmail ?? order.userId.slice(0, 8)}
                  </TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell className="font-mono">
                    {"\u20AC"}{order.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {"\u20AC"}{order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        statusMutation.mutate({ id: order.id, status: v as OrderStatus })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={STATUS_COLORS[order.status]}>
                          {t(`status.${order.status}`)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { OrderList } from "@/components/admin";

export default function OrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Order Management</h1>
      <OrderList />
    </div>
  );
}

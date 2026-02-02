import { OrderList } from "@/components/admin";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr";

export default function OrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
          <PackageIcon className="h-5 w-5 text-purple-500" weight="duotone" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Order Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage customer orders</p>
        </div>
      </div>
      <OrderList />
    </div>
  );
}

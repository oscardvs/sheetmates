import { ProductionQueue } from "@/components/admin";

export default function QueuePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Production Queue</h1>
      <ProductionQueue />
    </div>
  );
}

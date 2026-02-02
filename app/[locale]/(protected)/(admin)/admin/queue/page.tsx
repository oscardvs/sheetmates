import { ProductionQueue } from "@/components/admin";
import { QueueIcon } from "@phosphor-icons/react/dist/ssr";

export default function QueuePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <QueueIcon className="h-5 w-5 text-amber-500" weight="duotone" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground">Production Queue</h1>
          <p className="text-sm text-muted-foreground">Manage sheet cutting workflow</p>
        </div>
      </div>
      <ProductionQueue />
    </div>
  );
}

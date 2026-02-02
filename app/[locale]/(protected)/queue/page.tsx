"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getPartsByUser,
  updatePart,
  type PartDoc,
} from "@/lib/firebase/db/parts";
import { Link } from "@/i18n/navigation";
import {
  ListIcon,
  ArrowCounterClockwiseIcon,
  PackageIcon,
  CheckCircleIcon,
  SpinnerIcon,
  TruckIcon,
} from "@phosphor-icons/react";

export default function QueuePage() {
  const t = useTranslations("queue");
  const { user } = useAuth();
  const [parts, setParts] = useState<PartDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getPartsByUser(user.uid)
        .then(setParts)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "nested":
        return "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      case "cut":
        return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "shipped":
        return "text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10";
      default:
        return "text-muted-foreground border-border bg-muted/50";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <SpinnerIcon className="h-3 w-3" />;
      case "nested":
        return <PackageIcon className="h-3 w-3" />;
      case "cut":
        return <CheckCircleIcon className="h-3 w-3" />;
      case "shipped":
        return <TruckIcon className="h-3 w-3" />;
      default:
        return null;
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

  async function handleReset(id: string) {
    await updatePart(id, { status: "pending" });
    if (user) {
      const updated = await getPartsByUser(user.uid);
      setParts(updated);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="font-mono text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px w-8 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {t("badge")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl font-bold text-foreground">{t("title")}</h1>
          <div className="font-mono text-xs text-muted-foreground">
            {t("partsCount", {
              count: parts.length,
              type: parts.length === 1 ? t("partSingular") : t("partPlural")
            })}
          </div>
        </div>
      </div>

      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border bg-muted/50 py-20">
          <div className="flex h-16 w-16 items-center justify-center border border-border bg-card/50">
            <ListIcon className="h-8 w-8 text-muted-foreground" weight="light" />
          </div>
          <p className="font-mono text-sm text-foreground">{t("emptyState")}</p>
          <Link
            href="/upload"
            className="font-mono text-xs text-primary transition-colors hover:text-primary/80"
          >
            {t("emptyStateCta")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("partName")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("dimensions")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("qty")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr
                  key={part.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-4 font-mono text-sm font-medium text-foreground">
                    {part.fileName}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-muted-foreground">
                    {part.boundingBox.width.toFixed(1)} x{" "}
                    {part.boundingBox.height.toFixed(1)} mm
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-muted-foreground">
                    {part.quantity}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs uppercase ${statusColor(part.status)}`}
                    >
                      {statusIcon(part.status)}
                      {statusLabel(part.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {part.status === "pending" && (
                      <button
                        onClick={() => handleReset(part.id)}
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowCounterClockwiseIcon className="h-3 w-3" />
                        {t("reset")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      {parts.length > 0 && parts.some((p) => p.status === "pending" || p.status === "nested") && (
        <div className="flex justify-end">
          <Link
            href="/checkout"
            className="group inline-flex items-center gap-2 bg-primary px-6 py-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("proceedToCheckout")}
          </Link>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { getAnalyticsConfig } from "@/server/analytics/config.service";
import { AnalyticsConfigForm } from "@/components/admin/analytics/config-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnalyticsConfigPage() {
  await requirePermission("analytics.write");
  const cfg = await getAnalyticsConfig();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Analytics configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Heatmap / pixel providers + privacy knobs.{" "}
          <Link href="/admin/analytics" className="underline">
            Back to overview
          </Link>
        </p>
      </header>
      <AnalyticsConfigForm initial={cfg} />
    </div>
  );
}

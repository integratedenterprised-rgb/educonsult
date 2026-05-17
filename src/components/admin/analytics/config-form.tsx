"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AnalyticsConfig } from "@prisma/client";

interface Props {
  initial: AnalyticsConfig;
}

const PROVIDERS = ["NONE", "CLARITY", "HOTJAR", "POSTHOG", "FULLSTORY"] as const;

export function AnalyticsConfigForm({ initial }: Props) {
  const router = useRouter();
  const [state, setState] = React.useState({
    ga4MeasurementId: initial.ga4MeasurementId ?? "",
    gtmContainerId: initial.gtmContainerId ?? "",
    metaPixelId: initial.metaPixelId ?? "",
    heatmapProvider: initial.heatmapProvider,
    clarityProjectId: initial.clarityProjectId ?? "",
    hotjarSiteId: initial.hotjarSiteId ?? "",
    posthogApiKey: initial.posthogApiKey ?? "",
    posthogHost: initial.posthogHost ?? "https://app.posthog.com",
    fullstoryOrgId: initial.fullstoryOrgId ?? "",
    respectDoNotTrack: initial.respectDoNotTrack,
    requireConsent: initial.requireConsent,
    gscSiteUrl: initial.gscSiteUrl ?? "",
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body = {
      ...state,
      ga4MeasurementId: state.ga4MeasurementId || null,
      gtmContainerId: state.gtmContainerId || null,
      metaPixelId: state.metaPixelId || null,
      clarityProjectId: state.clarityProjectId || null,
      hotjarSiteId: state.hotjarSiteId || null,
      posthogApiKey: state.posthogApiKey || null,
      posthogHost: state.posthogHost || null,
      fullstoryOrgId: state.fullstoryOrgId || null,
      gscSiteUrl: state.gscSiteUrl || null,
    };
    const res = await fetch("/api/admin/analytics/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
    if (res.ok) router.refresh();
  };

  const rotateSalt = async () => {
    if (!confirm("Rotate the IP hash salt? Existing visitor fingerprints will reset.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/analytics/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rotateSalt: true }),
    });
    setBusy(false);
    setMsg(res.ok ? "Salt rotated." : "Failed.");
    if (res.ok) router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="Tag / pixel">
        <Field label="GA4 measurement ID" hint="G-XXXXXXX">
          <Input value={state.ga4MeasurementId} onChange={(v) => setState((s) => ({ ...s, ga4MeasurementId: v }))} />
        </Field>
        <Field label="GTM container ID" hint="GTM-XXXXXX">
          <Input value={state.gtmContainerId} onChange={(v) => setState((s) => ({ ...s, gtmContainerId: v }))} />
        </Field>
        <Field label="Meta pixel ID">
          <Input value={state.metaPixelId} onChange={(v) => setState((s) => ({ ...s, metaPixelId: v }))} />
        </Field>
      </Card>

      <Card title="Heatmap / session replay">
        <Field label="Provider">
          <select
            value={state.heatmapProvider}
            onChange={(e) => setState((s) => ({ ...s, heatmapProvider: e.target.value as typeof s.heatmapProvider }))}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        {state.heatmapProvider === "CLARITY" && (
          <Field label="Clarity project ID">
            <Input value={state.clarityProjectId} onChange={(v) => setState((s) => ({ ...s, clarityProjectId: v }))} />
          </Field>
        )}
        {state.heatmapProvider === "HOTJAR" && (
          <Field label="Hotjar site ID">
            <Input value={state.hotjarSiteId} onChange={(v) => setState((s) => ({ ...s, hotjarSiteId: v }))} />
          </Field>
        )}
        {state.heatmapProvider === "POSTHOG" && (
          <>
            <Field label="PostHog API key">
              <Input value={state.posthogApiKey} onChange={(v) => setState((s) => ({ ...s, posthogApiKey: v }))} />
            </Field>
            <Field label="PostHog host">
              <Input value={state.posthogHost} onChange={(v) => setState((s) => ({ ...s, posthogHost: v }))} />
            </Field>
          </>
        )}
        {state.heatmapProvider === "FULLSTORY" && (
          <Field label="FullStory org ID">
            <Input value={state.fullstoryOrgId} onChange={(v) => setState((s) => ({ ...s, fullstoryOrgId: v }))} />
          </Field>
        )}
      </Card>

      <Card title="Search Console">
        <Field label="GSC site URL" hint="sc-domain:example.com or https://www.example.com/">
          <Input value={state.gscSiteUrl} onChange={(v) => setState((s) => ({ ...s, gscSiteUrl: v }))} />
        </Field>
      </Card>

      <Card title="Privacy">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={state.respectDoNotTrack}
            onChange={(e) => setState((s) => ({ ...s, respectDoNotTrack: e.target.checked }))}
          />
          Respect Do-Not-Track
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={state.requireConsent}
            onChange={(e) => setState((s) => ({ ...s, requireConsent: e.target.checked }))}
          />
          Require consent before tracking
        </label>
        <button
          type="button"
          onClick={rotateSalt}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Rotate IP hash salt
        </button>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
    />
  );
}

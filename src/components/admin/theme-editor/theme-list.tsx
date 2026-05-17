"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { hslDisplay } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ThemePreset } from "@/types/theme";
import type { ApiResponse } from "@/types/api";

export function ThemeList({ themes }: { themes: ThemePreset[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | undefined>(
    themes.find((t) => t.isActive)?.id ?? themes[0]?.id,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function activate() {
    if (!selected) return;
    setError(null);
    const res = await fetch("/api/cms/theme/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ themeId: selected }),
    });
    const json = (await res.json()) as ApiResponse<{ activatedId: string }>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Color theme</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the active palette for the public site, or create a new one.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/settings/theme/new">
            <Plus className="mr-1 h-4 w-4" /> New theme
          </Link>
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => {
          const isSelected = selected === t.id;
          return (
            <li key={t.id}>
              <div
                className={cn(
                  "flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className="flex items-start justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-card-foreground">{t.name}</span>
                      {t.isActive ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Active
                        </span>
                      ) : null}
                      {t.isDefault ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{t.key}</p>
                  </div>
                </button>

                <div className="flex gap-1.5">
                  <Swatch token={t.tokens.primary} />
                  <Swatch token={t.tokens.secondary} />
                  <Swatch token={t.tokens.accent} />
                  <Swatch token={t.tokens.background} ring />
                  <Swatch token={t.tokens.foreground} />
                  <Swatch token={t.tokens.destructive} />
                </div>

                <p className="text-xs text-muted-foreground">
                  Radius {t.radius}rem · {t.fontHeading ?? "system"} / {t.fontBody ?? "system"}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/admin/settings/theme/${t.id}/edit`}>
                      <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button onClick={activate} disabled={!selected || isPending}>
          {isPending ? "Applying…" : "Apply selected theme"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Activating switches the public site immediately — no rebuild needed.
        </p>
      </div>
    </div>
  );
}

function Swatch({ token, ring }: { token: string; ring?: boolean }) {
  return (
    <span
      className={cn("inline-block h-7 w-7 rounded-md", ring && "ring-1 ring-border")}
      style={{ backgroundColor: hslDisplay(token) }}
    />
  );
}

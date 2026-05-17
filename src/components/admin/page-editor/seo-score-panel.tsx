"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { extractSeoMetrics, scoreSeo, type SeoIssue } from "@/lib/seo";
import type { PageFormValues } from "./types";

const LEVEL_META: Record<
  SeoIssue["level"],
  { Icon: typeof Info; badge: "danger" | "warning" | "ghost"; label: string }
> = {
  error: { Icon: AlertCircle, badge: "danger", label: "Error" },
  warning: { Icon: AlertTriangle, badge: "warning", label: "Warning" },
  info: { Icon: Info, badge: "ghost", label: "Tip" },
};

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 70) return "OK — fix warnings before publishing";
  if (score >= 50) return "Weak — address errors";
  return "Critical — major SEO issues";
}

/**
 * Live SEO score for the page editor. Recomputes on every form change via
 * `useWatch`. Pure client logic — `scoreSeo` is a synchronous helper, so
 * there's no network round-trip per keystroke.
 */
export function SeoScorePanel() {
  const { control } = useFormContext<PageFormValues>();
  const values = useWatch({ control }) as PageFormValues;

  const { score, issues } = useMemo(() => {
    const metrics = extractSeoMetrics((values?.sections ?? []) as unknown as Array<{ type: never; data: Record<string, unknown> }>);
    return scoreSeo({
      title: values?.title ?? "",
      metaTitle: values?.seoTitle ?? null,
      metaDescription: values?.seoDescription ?? null,
      metaKeywords: values?.seoKeywords ?? null,
      slug: values?.slug ?? "",
      ogImageUrl: values?.ogImageUrl ?? null,
      bodyText: metrics.bodyText,
      hasFaq: metrics.hasFaq,
      internalLinkCount: metrics.internalLinkCount,
      externalLinkCount: metrics.externalLinkCount,
      hasH1: metrics.hasH1,
      sectionCount: metrics.sectionCount,
    });
  }, [values]);

  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <Text size="xs" weight="medium" tone="muted" className="uppercase tracking-wider">
            SEO score
          </Text>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={cn("font-heading text-3xl font-semibold", scoreColor(score))}>{score}</span>
            <Text size="sm" tone="muted">
              / 100
            </Text>
          </p>
          <Text size="xs" tone="muted" className="mt-1">
            {scoreLabel(score)}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-1">
          {errors > 0 ? (
            <Badge variant="danger">
              <AlertCircle className="h-3 w-3" aria-hidden /> {errors} error{errors === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {warnings > 0 ? (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3" aria-hidden /> {warnings} warning
              {warnings === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {errors === 0 && warnings === 0 ? (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Clean
            </Badge>
          ) : null}
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {issues.map((issue, i) => {
            const meta = LEVEL_META[issue.level];
            const Icon = meta.Icon;
            return (
              <li key={i} className="flex items-start gap-2">
                <Icon
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    issue.level === "error" && "text-destructive",
                    issue.level === "warning" && "text-amber-600 dark:text-amber-400",
                    issue.level === "info" && "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <Text size="xs">
                  {issue.message}
                  {issue.field ? (
                    <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {issue.field}
                    </code>
                  ) : null}
                </Text>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

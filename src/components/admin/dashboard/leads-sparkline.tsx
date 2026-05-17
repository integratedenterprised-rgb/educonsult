"use client";

import type { LeadsTimeseriesPoint } from "@/server/analytics/dashboard.service";

interface Props { points: LeadsTimeseriesPoint[] }

export function LeadsSparkline({ points }: Props) {
  if (points.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.count));
  const width = 600;
  const height = 120;
  const stepX = width / Math.max(1, points.length - 1);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${height - (p.count / max) * height}`)
    .join(" ");
  const areaPath = `${linePath} L ${(points.length - 1) * stepX} ${height} L 0 ${height} Z`;

  const total = points.reduce((s, p) => s + p.count, 0);

  return (
    <div className="mt-4">
      <p className="text-3xl font-semibold">{total}</p>
      <p className="text-xs text-muted-foreground">leads received</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-32 w-full overflow-visible">
        <path d={areaPath} fill="hsl(var(--primary) / 0.12)" />
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={i * stepX}
            cy={height - (p.count / max) * height}
            r="2"
            fill="hsl(var(--primary))"
          >
            <title>{p.date}: {p.count}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

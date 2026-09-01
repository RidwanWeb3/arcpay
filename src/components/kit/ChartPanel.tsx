import { DataPanel } from "./primitives";

/** Terminal-style sparkline / bar charts drawn with pure SVG — no chart lib weight. */

export function LineChartPanel({
  title,
  data,
  unit = "",
  right,
}: {
  title: string;
  data: number[];
  unit?: string;
  right?: React.ReactNode;
}) {
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${40 - (v / max) * 34}`)
    .join(" ");

  return (
    <DataPanel title={title} right={right}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-32 w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id={`fill-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[10, 20, 30].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--color-border)" strokeWidth="0.25" />
        ))}
        <polygon points={`0,40 ${pts} 100,40`} fill={`url(#fill-${title.replace(/\s/g, "")})`} />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>T-12</span>
        <span className="text-accent">
          PEAK {max}
          {unit}
        </span>
        <span>NOW</span>
      </div>
    </DataPanel>
  );
}

export function BarChartPanel({
  title,
  data,
  right,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  right?: React.ReactNode;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <DataPanel title={title} right={right}>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.label} className="grid grid-cols-[88px_minmax(0,1fr)_40px] items-center gap-2">
            <span className="label-mono truncate">{d.label}</span>
            <span className="h-2 w-full border border-border bg-background/60">
              <span
                className="block h-full bg-gradient-to-r from-primary to-cyan"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-[10px] text-silver tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </DataPanel>
  );
}

export function HistogramPanel({
  title,
  data,
  right,
}: {
  title: string;
  data: number[];
  right?: React.ReactNode;
}) {
  const max = Math.max(...data, 1);
  return (
    <DataPanel title={title} right={right}>
      <div className="flex h-32 items-end gap-1">
        {data.map((v, i) => (
          <span
            key={i}
            className="flex-1 bg-gradient-to-t from-primary/30 to-accent transition-all"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
    </DataPanel>
  );
}

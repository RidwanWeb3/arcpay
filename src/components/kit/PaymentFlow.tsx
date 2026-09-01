import { cn } from "@/lib/utils";

export const PAYMENT_STAGES = ["REQUEST", "AUTHORIZATION", "VERIFICATION", "SETTLEMENT", "CONFIRMED"] as const;
export type PaymentStage = (typeof PAYMENT_STAGES)[number];

export function PaymentFlow({ stageIndex }: { stageIndex: number }) {
  return (
    <div className="relative overflow-hidden border border-border bg-background/50 p-4">
      {stageIndex >= 0 && stageIndex < PAYMENT_STAGES.length - 1 ? (
        <span className="pointer-events-none absolute top-1/2 h-[2px] w-8 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan to-transparent animate-packet" />
      ) : null}
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PAYMENT_STAGES.map((s, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center border font-mono text-[10px]",
                  done && "border-success/60 bg-success/15 text-success",
                  active && "border-accent bg-accent/15 text-accent animate-status",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 truncate font-mono text-[10px] tracking-[0.14em]",
                  done && "text-success",
                  active && "text-accent",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

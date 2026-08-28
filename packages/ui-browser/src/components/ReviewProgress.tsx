import { MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { buildThreads, unresolvedCount } from "@/lib/threads";
import { cn } from "@/lib/utils";

/**
 * Compact review-progress readout for the sidebar: how many files are
 * marked viewed, and how many comment threads are still unresolved. When
 * every file is reviewed it turns into a small, restrained celebration.
 */
export const ReviewProgress = ({
  total,
  viewed,
}: {
  total: number;
  viewed: number;
}) => {
  const asks = useStore((s) => s.asks);
  const askOrder = useStore((s) => s.askOrder);
  const resolvedThreads = useStore((s) => s.resolvedThreads);

  const unresolved = unresolvedCount(
    buildThreads(asks, askOrder, resolvedThreads),
  );

  if (total === 0) return null;

  const pct = Math.round((viewed / total) * 100);
  const complete = viewed === total;

  return (
    <div className="border-b px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between text-[0.7rem]">
        <span className={cn("font-medium", complete && "text-emerald-600 dark:text-emerald-400")}>
          {complete ? "All files reviewed 🦆" : `${String(viewed)} of ${String(total)} reviewed`}
        </span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={viewed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Files reviewed"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
            complete ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${String(pct)}%` }}
        />
      </div>
      {unresolved > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <MessageCircle className="size-3" aria-hidden />
          {unresolved} unresolved comment{unresolved === 1 ? "" : "s"}
          <span className="text-muted-foreground/70">· press n</span>
        </div>
      )}
    </div>
  );
};

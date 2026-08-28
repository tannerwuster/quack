import { Loader2, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";
import { useStore, type Ask } from "@/lib/store";

const formatRange = (fromLine: number, toLine: number): string =>
  fromLine === toLine ? String(fromLine) : `${String(fromLine)}–${String(toLine)}`;

export const ThreadEntry = ({ ask }: { ask: Ask }) => {
  const cancel = useStore((s) => s.cancel);
  const retryAsk = useStore((s) => s.retryAsk);

  const showAnswer = ask.response.length > 0 || ask.status === "done";

  return (
    <div className="space-y-1.5">
      {/* The reviewer's question. */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-secondary-foreground">
          You
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
          L{formatRange(ask.fromLine, ask.toLine)}
        </span>
        {ask.status === "streaming" && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs"
            onClick={() => {
              cancel(ask.id);
            }}
          >
            Stop
          </Button>
        )}
      </div>
      <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">{ask.question}</div>

      {/* Claude's streamed answer, visually distinct as AI output. */}
      {showAnswer && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3" aria-hidden />
            Claude
            <span className="rounded bg-primary/15 px-1 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide">
              {ask.model ?? "AI"}
            </span>
            {ask.status === "streaming" && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" aria-hidden />
            )}
          </div>
          <Markdown source={ask.response || "_Thinking…_"} />
        </div>
      )}

      {ask.status === "streaming" && !showAnswer && (
        <div
          className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Asking Claude…
        </div>
      )}

      {ask.status === "cancelled" && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span>Cancelled.</span>
          <RetryButton onClick={() => retryAsk(ask.id)} />
        </div>
      )}

      {ask.status === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span className="flex-1">{ask.error ?? "Something went wrong."}</span>
          <RetryButton onClick={() => retryAsk(ask.id)} />
        </div>
      )}
    </div>
  );
};

const RetryButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="outline" size="sm" className="h-6 gap-1 text-xs" onClick={onClick}>
    <RotateCw className="size-3" aria-hidden />
    Retry
  </Button>
);

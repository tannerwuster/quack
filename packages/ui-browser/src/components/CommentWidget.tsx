import { useEffect, useRef, useState } from "react";
import { Check, CircleDot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore, threadKey, type Ask } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ModelPicker } from "./ModelPicker";
import { ThreadEntry } from "./ThreadEntry";

type Props = {
  file: string;
  fromLine: number;
  toLine: number;
  /** Raw text of the lines being commented on (used as the ask `chunk`). */
  chunk: string;
  asks: Ask[];
};

const formatRange = (fromLine: number, toLine: number): string =>
  fromLine === toLine ? String(fromLine) : `${String(fromLine)}–${String(toLine)}`;

const shortPath = (path: string): string => {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
};

export const CommentWidget = ({ file, fromLine, toLine, chunk, asks }: Props) => {
  const [draft, setDraft] = useState("");
  const startAsk = useStore((s) => s.startAsk);
  const closeComposer = useStore((s) => s.closeComposer);
  const conn = useStore((s) => s.conn);
  const key = threadKey(file, toLine);
  const resolved = useStore((s) => s.resolvedThreads[key] === true);
  const toggleResolved = useStore((s) => s.toggleResolved);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasAsks = asks.length > 0;

  // A widget mounts in two cases: a fresh composer the user just opened
  // (no asks yet), or an already-submitted thread. Only steal focus in
  // the first case so existing threads don't snatch the caret on render.
  const hasAsksOnMount = useRef(hasAsks);
  useEffect(() => {
    if (!hasAsksOnMount.current) textareaRef.current?.focus();
  }, []);

  const streaming = asks.some((a) => a.status === "streaming");
  const canSend = draft.trim().length > 0 && conn.state === "open" && !streaming;

  const submit = () => {
    const question = draft.trim();
    if (!question || conn.state !== "open" || streaming) return;
    startAsk({ file, fromLine, toLine, chunk, question });
    setDraft("");
  };

  const handleClose = () => {
    if (!hasAsks) closeComposer(file, fromLine);
  };

  return (
    <div
      data-thread={key}
      className={cn(
        "my-1 rounded-md border bg-card shadow-sm transition-opacity",
        resolved && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {shortPath(file)}:{formatRange(fromLine, toLine)}
          </span>
          {resolved && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-emerald-600/15 px-1.5 py-0.5 text-[0.65rem] font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="size-2.5" strokeWidth={3} aria-hidden />
              Resolved
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasAsks && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs"
              onClick={() => {
                toggleResolved(key);
              }}
              aria-pressed={resolved}
            >
              {resolved ? (
                <>
                  <CircleDot className="size-3" aria-hidden />
                  Reopen
                </>
              ) : (
                <>
                  <Check className="size-3" aria-hidden />
                  Resolve
                </>
              )}
            </Button>
          )}
          {!hasAsks && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleClose}
              aria-label="Cancel comment"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {hasAsks && (
        <div className="space-y-3 p-3">
          {asks.map((ask) => (
            <ThreadEntry key={ask.id} ask={ask} />
          ))}
        </div>
      )}

      {!resolved && (
        <div className="space-y-2 p-3 pt-0">
          {!hasAsks && <div className="h-1" />}
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            placeholder={hasAsks ? "Reply or follow up…" : "Ask Claude about this code…"}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape" && !hasAsks) {
                e.preventDefault();
                handleClose();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <ModelPicker />
            <div className="flex items-center gap-2">
              {!hasAsks && (
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                disabled={!canSend}
                onClick={submit}
                title="Send (⌘/Ctrl+Enter)"
              >
                <Send className="mr-1 size-3.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

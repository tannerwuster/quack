import { useEffect, useMemo, useRef, useState } from "react";
import { parseDiff } from "react-diff-view";
import { useStore } from "@/lib/store";
import { filePath } from "@/lib/selection";
import { FilePane } from "./FilePane";
import { FileHeader } from "./FileHeader";
import { Button } from "./ui/button";
import { readLocal, writeLocal } from "@/lib/persist";

export const DiffPane = () => {
  const diff = useStore((s) => s.diff);
  const conn = useStore((s) => s.conn);
  const project = useStore((s) => s.project);
  const fileCollapsed = useStore((s) => s.fileCollapsed);
  const scrollRequest = useStore((s) => s.scrollRequest);
  const [hintDismissed, setHintDismissed] = useState(
    () => readLocal("askdiff:hint-dismissed") === "1",
  );

  const files = useMemo(() => (diff ? parseDiff(diff.raw) : []), [diff]);

  const sectionRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!scrollRequest) return;
    const el = sectionRefs.current.get(scrollRequest.path);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [scrollRequest]);

  if (conn.state === "connecting") {
    return <ConnState text={`Connecting to ${project ?? "askdiff server"}…`} />;
  }
  if (conn.state === "error" || conn.state === "closed") {
    return (
      <ConnState
        text={
          conn.state === "error"
            ? `Connection error: ${conn.error}`
            : `Disconnected${conn.reason ? `: ${conn.reason}` : ""}. Retrying…`
        }
        retry
      />
    );
  }
  if (!diff) return <ConnState text="Waiting for diff…" />;
  if (files.length === 0) return <ConnState text="No changes in the working tree." />;

  return (
    <div className="space-y-4 p-4">
      {!hintDismissed && (
        <div className="flex items-center justify-between rounded-md border bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Hover a line and click the <strong>+</strong> to ask Quack about it.
          </span>
          <button
            type="button"
            className="ml-3 rounded px-1.5 py-0.5 hover:bg-accent"
            onClick={() => {
              writeLocal("askdiff:hint-dismissed", "1");
              setHintDismissed(true);
            }}
          >
            Got it
          </button>
        </div>
      )}
      {files.map((file) => {
        const path = filePath(file);
        const collapsed = fileCollapsed[path] === true;
        return (
          <section
            key={path}
            ref={(el) => {
              if (el) sectionRefs.current.set(path, el);
              else sectionRefs.current.delete(path);
            }}
            className="scroll-mt-2 overflow-hidden rounded-md border bg-card"
          >
            <FileHeader file={file} />
            {!collapsed && <FilePane file={file} />}
          </section>
        );
      })}
    </div>
  );
};

const ConnState = ({ text, retry }: { text: string; retry?: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
    <span>{text}</span>
    {retry && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          location.reload();
        }}
      >
        Reload
      </Button>
    )}
  </div>
);

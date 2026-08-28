import { useEffect, useMemo, useRef } from "react";
import { parseDiff } from "react-diff-view";
import { useStore } from "@/lib/store";
import { filePath } from "@/lib/selection";
import { changedLineCount, matchesFilter, resolveCollapsed } from "@/lib/diff-utils";
import { FilePane } from "./FilePane";
import { FileHeader } from "./FileHeader";
import { PixelDuck } from "./PixelDuck";
import { ConnState } from "./states/ConnState";
import { EmptyState } from "./states/EmptyState";

export const DiffPane = () => {
  const diff = useStore((s) => s.diff);
  const conn = useStore((s) => s.conn);
  const project = useStore((s) => s.project);
  const fileCollapsed = useStore((s) => s.fileCollapsed);
  const fileViewed = useStore((s) => s.fileViewed);
  const scrollRequest = useStore((s) => s.scrollRequest);
  const setCollapsed = useStore((s) => s.setCollapsed);
  const filterQuery = useStore((s) => s.filterQuery);
  const filterTypes = useStore((s) => s.filterTypes);

  const allFiles = useMemo(() => (diff ? parseDiff(diff.raw) : []), [diff]);
  const files = useMemo(
    () => allFiles.filter((f) => matchesFilter(f, filterQuery, filterTypes)),
    [allFiles, filterQuery, filterTypes],
  );
  const filtering = filterQuery.trim() !== "" || filterTypes.length > 0;

  const sectionRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!scrollRequest) return;
    const el = sectionRefs.current.get(scrollRequest.path);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [scrollRequest]);

  if (conn.state === "connecting") {
    return <ConnState kind="connecting" project={project} />;
  }
  if (conn.state === "error" || conn.state === "closed") {
    return (
      <ConnState
        kind="disconnected"
        detail={
          conn.state === "error"
            ? conn.error
            : conn.reason
              ? conn.reason
              : undefined
        }
      />
    );
  }
  if (!diff) return <ConnState kind="loading" project={project} />;
  if (allFiles.length === 0) return <EmptyState kind="clean" />;
  if (files.length === 0) return <EmptyState kind="no-match" />;

  const allViewed = allFiles.every((f) => fileViewed[filePath(f)] === true);

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {files.map((file) => {
        const path = filePath(file);
        const collapsed = resolveCollapsed(fileCollapsed[path], file);
        return (
          <section
            key={path}
            data-file-path={path}
            ref={(el) => {
              if (el) sectionRefs.current.set(path, el);
              else sectionRefs.current.delete(path);
            }}
            className="scroll-mt-2 overflow-hidden rounded-md border bg-card"
          >
            <FileHeader file={file} />
            {collapsed ? (
              <CollapsedBody
                lines={changedLineCount(file)}
                onExpand={() => {
                  setCollapsed(path, false);
                }}
              />
            ) : (
              <FilePane file={file} />
            )}
          </section>
        );
      })}
      {filtering && (
        <div className="px-1 py-2 text-center text-xs text-muted-foreground">
          Showing {files.length} of {allFiles.length} files
        </div>
      )}
      {allViewed && !filtering && <ReviewComplete />}
    </div>
  );
};

const ReviewComplete = () => (
  <div
    className="mt-1 flex flex-col items-center gap-2 rounded-md border border-dashed bg-card/50 px-4 py-6 text-center"
    role="status"
    aria-live="polite"
  >
    <PixelDuck className="size-10" />
    <div className="text-sm font-medium">Every file reviewed — nice work.</div>
    <div className="max-w-xs text-xs text-muted-foreground">
      You&apos;ve looked at all the changes. Resolve any open comments, then
      ship it. <span aria-hidden>🦆</span>
    </div>
  </div>
);

const CollapsedBody = ({
  lines,
  onExpand,
}: {
  lines: number;
  onExpand: () => void;
}) => (
  <button
    type="button"
    onClick={onExpand}
    className="flex w-full items-center justify-center gap-2 px-3 py-3 text-xs text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  >
    Collapsed{lines > 0 ? ` · ${String(lines)} changed lines` : ""} — click to expand
  </button>
);

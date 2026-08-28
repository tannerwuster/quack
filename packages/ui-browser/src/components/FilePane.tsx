import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Diff,
  Hunk,
  getChangeKey,
  type FileData,
} from "react-diff-view";
import { useStore, type Ask } from "@/lib/store";
import {
  changeNewLine,
  chunkForLine,
  filePath,
  rangeFromSelectedChanges,
} from "@/lib/selection";
import { useDiffTokens } from "@/hooks/use-diff-tokens";
import { hasNoTextualChanges, nonTextLabel, nonTextReason } from "@/lib/diff-utils";
import { cn } from "@/lib/utils";
import { CommentWidget } from "./CommentWidget";
import { FileImage } from "lucide-react";

type OpenComposer = { fromLine: number; toLine: number; chunk: string };

type Drag =
  | { phase: "idle" }
  | { phase: "dragging"; start: string; end: string }
  | { phase: "locked"; start: string; end: string };

const IDLE: Drag = { phase: "idle" };

export const FilePane = ({ file }: { file: FileData }) => {
  // Binary blobs, pure renames and mode-only changes arrive with no hunks;
  // there's nothing to diff, so show a graceful panel instead of an empty
  // pane. Branch here — before any hook — so hook order stays stable.
  if (hasNoTextualChanges(file)) {
    return <NonTextPanel file={file} />;
  }
  return <TextDiff file={file} />;
};

const TextDiff = ({ file }: { file: FileData }) => {
  const path = filePath(file);
  const asks = useStore((s) => s.asks);
  const askOrder = useStore((s) => s.askOrder);
  const openAnchors = useStore((s) => s.openAnchors);
  const openComposer = useStore((s) => s.openComposer);
  const viewMode = useStore((s) => s.viewMode);
  const wrapLines = useStore((s) => s.wrapLines);
  const tokens = useDiffTokens(file);

  const [drag, setDrag] = useState<Drag>(IDLE);

  // Reset selection when switching to a different file.
  useEffect(() => {
    setDrag(IDLE);
  }, [path]);

  // Document-level mouseup so releasing outside the diff still finalizes.
  // The ref tracks the latest endpoints so the listener doesn't re-bind on
  // every mouseenter (which fires once per gutter row during a drag).
  const dragRef = useRef(drag);
  dragRef.current = drag;
  useEffect(() => {
    if (drag.phase !== "dragging") return;
    const onUp = () => {
      const d = dragRef.current;
      if (d.phase !== "dragging") return;
      // Single click (start === end) → single-line comment, no lingering
      // selection. Drag → multi-line comment with the range kept
      // highlighted in a "locked" phase until the next gutter interaction.
      const opener = composerOpener(file, d.start, d.end, path);
      setDrag(d.start === d.end ? IDLE : { phase: "locked", start: d.start, end: d.end });
      if (opener) openComposer(opener);
    };
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
    };
  }, [drag.phase, file, openComposer, path]);

  const selectedKeys = useMemo(() => {
    if (drag.phase === "idle") return [];
    const all = file.hunks.flatMap((h) => h.changes);
    const startIdx = all.findIndex((c) => getChangeKey(c) === drag.start);
    const endIdx = all.findIndex((c) => getChangeKey(c) === drag.end);
    if (startIdx === -1 || endIdx === -1) return [];
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    return all.slice(from, to + 1).map((c) => getChangeKey(c));
  }, [drag, file.hunks]);

  // Widgets render at toLine — i.e. the bottom of a multi-line range —
  // so the composer/thread sits where the user finished selecting.
  const asksByLine = useMemo(() => {
    const m = new Map<number, Ask[]>();
    for (const id of askOrder) {
      const ask = asks[id];
      if (!ask || ask.file !== path) continue;
      const list = m.get(ask.toLine) ?? [];
      list.push(ask);
      m.set(ask.toLine, list);
    }
    return m;
  }, [asks, askOrder, path]);

  const openByLine = useMemo(() => {
    const m = new Map<number, OpenComposer>();
    for (const [key, meta] of Object.entries(openAnchors)) {
      const colon = key.lastIndexOf(":");
      if (colon < 0) continue;
      if (key.slice(0, colon) !== path) continue;
      m.set(meta.toLine, meta);
    }
    return m;
  }, [openAnchors, path]);

  const widgets = useMemo(
    () => buildWidgets(file, asksByLine, openByLine),
    [file, asksByLine, openByLine],
  );

  // Comment widgets are injected as full-width rows inside react-diff-view's
  // table, which is `width: max-content` (as wide as the widest code line).
  // Left alone, a widget stretches to that width and Claude's answer runs off
  // the right edge. We pin the widget to the visible pane (sticky, left:0) and
  // cap its width to the scroll container's client width, published here as a
  // CSS variable so the pure-CSS rule in globals.css can read it.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const sync = () => {
      el.style.setProperty("--quack-pane-w", `${String(el.clientWidth)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn("quack-diff-scroll overflow-x-auto", wrapLines && "quack-wrap")}
    >
      <Diff
        viewType={viewMode}
        diffType={file.type}
        hunks={file.hunks}
        tokens={tokens}
        widgets={widgets}
        selectedChanges={selectedKeys}
        renderGutter={({ change, side, renderDefault, wrapInAnchor }) =>
          wrapInAnchor(
            <>
              {renderDefault()}
              {side === "new" && changeNewLine(change) !== null && (
                <span className="quack-add-comment" aria-hidden>
                  +
                </span>
              )}
            </>,
          )
        }
        gutterEvents={{
          onMouseDown: ({ change }, event) => {
            if (!change) return;
            // Prevent the browser's text-selection drag from kicking in.
            event.preventDefault();
            const key = getChangeKey(change);
            setDrag({ phase: "dragging", start: key, end: key });
          },
          onMouseEnter: ({ change }) => {
            if (!change) return;
            const key = getChangeKey(change);
            setDrag((d) => (d.phase === "dragging" ? { ...d, end: key } : d));
          },
        }}
      >
        {(hunks) => hunks.map((h) => <Hunk key={h.newStart} hunk={h} />)}
      </Diff>
    </div>
  );
};

// Resolve the start/end change keys of a drag into an `openComposer`
// payload. Returns null when the selection covers no commentable lines
// (e.g. dragging through pure deletions).
const composerOpener = (
  file: FileData,
  startKey: string,
  endKey: string,
  path: string,
): { file: string; fromLine: number; toLine: number; chunk: string } | null => {
  const all = file.hunks.flatMap((h) => h.changes);
  if (startKey === endKey) {
    const change = all.find((c) => getChangeKey(c) === startKey);
    if (!change) return null;
    const line = changeNewLine(change);
    if (line === null) return null;
    return { file: path, fromLine: line, toLine: line, chunk: chunkForLine(change) };
  }
  const startIdx = all.findIndex((c) => getChangeKey(c) === startKey);
  const endIdx = all.findIndex((c) => getChangeKey(c) === endKey);
  if (startIdx === -1 || endIdx === -1) return null;
  const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
  const keys = all.slice(from, to + 1).map((c) => getChangeKey(c));
  const range = rangeFromSelectedChanges(file.hunks, keys);
  if (!range) return null;
  return { file: path, ...range };
};

const buildWidgets = (
  file: FileData,
  asksByLine: Map<number, Ask[]>,
  openByLine: Map<number, OpenComposer>,
): Record<string, ReactNode> => {
  const widgets: Record<string, ReactNode> = {};
  const path = filePath(file);

  for (const hunk of file.hunks) {
    for (const change of hunk.changes) {
      const line = changeNewLine(change);
      if (line === null) continue;
      const asks = asksByLine.get(line) ?? [];
      const open = openByLine.get(line);
      if (asks.length === 0 && !open) continue;
      const latest = asks[asks.length - 1];
      const fromLine = latest?.fromLine ?? open?.fromLine ?? line;
      const toLine = latest?.toLine ?? open?.toLine ?? line;
      const chunk = latest?.chunk ?? open?.chunk ?? chunkForLine(change);
      widgets[getChangeKey(change)] = (
        <CommentWidget
          file={path}
          fromLine={fromLine}
          toLine={toLine}
          chunk={chunk}
          asks={asks}
        />
      );
    }
  }
  return widgets;
};

const NonTextPanel = ({ file }: { file: FileData }) => {
  const reason = nonTextReason(file);
  return (
    <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
      <FileImage className="size-5 shrink-0 opacity-70" aria-hidden="true" />
      <div>
        <div className="font-medium text-foreground">{nonTextLabel(reason)}</div>
        <div className="mt-0.5 text-xs">
          Quack shows text diffs. This change has no reviewable text content.
        </div>
      </div>
    </div>
  );
};

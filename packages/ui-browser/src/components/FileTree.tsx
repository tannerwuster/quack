import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen, Search, X } from "lucide-react";
import { parseDiff } from "react-diff-view";
import { useStore } from "@/lib/store";
import { filePath } from "@/lib/selection";
import { fileBadge } from "@/lib/file-badge";
import { matchesFilter } from "@/lib/diff-utils";
import { iconForFile } from "@/lib/file-icon";
import { FileTypeIcon } from "./file-icons";
import { ReviewProgress } from "./ReviewProgress";
import { buildFileTree, countLeaves, type TreeDir, type TreeFile, type TreeNode } from "@/lib/file-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { readLocal, writeLocal } from "@/lib/persist";

const ROW_PAD = 12;

const MIN_W = 180;
const MAX_W = 520;
const clampW = (n: number) => Math.min(MAX_W, Math.max(MIN_W, n));

// Change types offered as quick filter chips, with their badge letters.
const TYPE_CHIPS: { type: string; label: string }[] = [
  { type: "add", label: "A" },
  { type: "modify", label: "M" },
  { type: "delete", label: "D" },
  { type: "rename", label: "R" },
];

export const FileTree = () => {
  const diff = useStore((s) => s.diff);
  const [width, setWidth] = useState(() => {
    const raw = Number(readLocal("quack:sidebar-width"));
    return Number.isFinite(raw) && raw >= MIN_W && raw <= MAX_W ? raw : 256;
  });

  const filterQuery = useStore((s) => s.filterQuery);
  const filterTypes = useStore((s) => s.filterTypes);
  const setFilterQuery = useStore((s) => s.setFilterQuery);
  const toggleFilterType = useStore((s) => s.toggleFilterType);
  const clearFilter = useStore((s) => s.clearFilter);
  const focusFilterNonce = useStore((s) => s.focusFilterNonce);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusFilterNonce > 0) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [focusFilterNonce]);

  const allFiles = useMemo(() => (diff ? parseDiff(diff.raw) : []), [diff]);
  const files = useMemo(
    () => allFiles.filter((f) => matchesFilter(f, filterQuery, filterTypes)),
    [allFiles, filterQuery, filterTypes],
  );
  const tree = useMemo(() => buildFileTree(files), [files]);
  const fileViewed = useStore((s) => s.fileViewed);
  const viewedCount = allFiles.reduce(
    (n, f) => (fileViewed[filePath(f)] === true ? n + 1 : n),
    0,
  );
  const availableTypes = useMemo(
    () => new Set<string>(allFiles.map((f) => f.type)),
    [allFiles],
  );
  const filtering = filterQuery.trim() !== "" || filterTypes.length > 0;

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r bg-card"
      style={{ width }}
      aria-label="Changed files"
    >
      <div className="border-b px-2 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={searchRef}
            type="text"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
            }}
            placeholder="Filter files…"
            aria-label="Filter files by name"
            className="h-7 w-full rounded-md border bg-background pl-7 pr-7 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {filtering && (
            <button
              type="button"
              onClick={clearFilter}
              aria-label="Clear filter"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          {TYPE_CHIPS.filter((c) => availableTypes.has(c.type)).map((c) => {
            const active = filterTypes.includes(c.type);
            const badge = fileBadge(c.type);
            return (
              <button
                key={c.type}
                type="button"
                onClick={() => {
                  toggleFilterType(c.type);
                }}
                aria-pressed={active}
                title={`${badge.title} files`}
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded text-[0.65rem] font-bold transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  badge.className,
                  active ? "ring-1 ring-ring ring-offset-1 ring-offset-card" : "opacity-50 hover:opacity-100",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <ReviewProgress total={allFiles.length} viewed={viewedCount} />
      <ScrollArea className="flex-1">
        {tree.length === 0 ? (
          // Only call it a filter miss when a filter is actually active;
          // an empty tree with no filter just means "no diff yet".
          filtering ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No files match.
            </div>
          ) : null
        ) : (
          <ul className="py-1">
            {tree.map((node) => (
              <Node key={node.path} node={node} depth={0} />
            ))}
          </ul>
        )}
      </ScrollArea>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startW = width;
          const onMove = (ev: MouseEvent) => {
            setWidth(clampW(startW + ev.clientX - startX));
          };
          const onUp = (ev: MouseEvent) => {
            writeLocal("quack:sidebar-width", String(clampW(startW + ev.clientX - startX)));
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40"
      />
    </aside>
  );
};

const Node = ({ node, depth }: { node: TreeNode; depth: number }) =>
  node.kind === "dir" ? (
    <DirRow dir={node} depth={depth} />
  ) : (
    <FileRow file={node} depth={depth} />
  );

const DirRow = ({ dir, depth }: { dir: TreeDir; depth: number }) => {
  const collapsed = useStore((s) => s.treeCollapsed[dir.path] === true);
  const toggleTreeNode = useStore((s) => s.toggleTreeNode);
  const askCount = useStore((s) =>
    countLeaves(dir, (f) =>
      s.askOrder.reduce((n, id) => (s.asks[id]?.file === f.path ? n + 1 : n), 0),
    ),
  );
  const fileViewed = useStore((s) => s.fileViewed);
  const total = countLeaves(dir, () => 1);
  const viewed = countLeaves(dir, (f) => (fileViewed[f.path] === true ? 1 : 0));
  const allViewed = total > 0 && viewed === total;
  const Chev = collapsed ? ChevronRight : ChevronDown;
  const FolderIcon = collapsed ? Folder : FolderOpen;

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          toggleTreeNode(dir.path);
        }}
        style={{ paddingLeft: depth * ROW_PAD + 8 }}
        className={cn(
          "flex w-full items-center gap-1 py-1 pr-3 text-left text-xs hover:bg-accent",
          allViewed && "text-muted-foreground",
        )}
        aria-expanded={!collapsed}
      >
        <Chev className="size-3 shrink-0 text-muted-foreground" />
        <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono" title={dir.name}>
          {dir.name}
        </span>
        {askCount > 0 && (
          <span className="ml-auto rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
            {askCount}
          </span>
        )}
      </button>
      {!collapsed && (
        <ul>
          {dir.children.map((c) => (
            <Node key={c.path} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileRow = ({ file, depth }: { file: TreeFile; depth: number }) => {
  const selectedFile = useStore((s) => s.selectedFile);
  const isActive = file.path === selectedFile;
  const isViewed = useStore((s) => s.fileViewed[file.path] === true);
  const askCount = useStore((s) =>
    s.askOrder.reduce((n, id) => (s.asks[id]?.file === file.path ? n + 1 : n), 0),
  );
  const requestScrollTo = useStore((s) => s.requestScrollTo);
  const badge = fileBadge(file.file.type);

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          requestScrollTo(file.path);
        }}
        // The chevron column on dir rows is `size-3 + gap-1` ≈ 16px. Add
        // the same to leaf rows so files line up under their dir's icon.
        style={{ paddingLeft: depth * ROW_PAD + 8 + 16 }}
        className={cn(
          "flex w-full items-center gap-2 py-1 pr-3 text-left text-xs hover:bg-accent",
          isActive && "bg-accent font-medium",
          isViewed && "text-muted-foreground",
        )}
      >
        <FileTypeIcon icon={iconForFile(file.name)} className="size-4 shrink-0" />
        <span
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded text-[0.65rem] font-bold",
            badge.className,
          )}
        >
          {badge.label}
        </span>
        <span className="truncate font-mono" title={file.path}>
          {file.name}
        </span>
        {askCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
            {askCount}
          </span>
        )}
        {isViewed && (
          <Check
            className="size-3 shrink-0 text-emerald-600"
            aria-label="viewed"
          />
        )}
      </button>
    </li>
  );
};

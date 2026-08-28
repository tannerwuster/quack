import { useMemo } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import type { FileData } from "react-diff-view";
import { useStore } from "@/lib/store";
import { filePath } from "@/lib/selection";
import { fileBadge } from "@/lib/file-badge";
import { countChanges, isLargeFile, resolveCollapsed } from "@/lib/diff-utils";
import { cn } from "@/lib/utils";

export const FileHeader = ({ file }: { file: FileData }) => {
  const path = filePath(file);
  const explicitCollapsed = useStore((s) => s.fileCollapsed[path]);
  const collapsed = resolveCollapsed(explicitCollapsed, file);
  const viewed = useStore((s) => s.fileViewed[path] === true);
  const setCollapsed = useStore((s) => s.setCollapsed);
  const toggleViewed = useStore((s) => s.toggleViewed);
  const askCount = useStore((s) =>
    s.askOrder.reduce((n, id) => (s.asks[id]?.file === path ? n + 1 : n), 0),
  );

  const { adds, dels } = useMemo(() => countChanges(file), [file]);
  const badge = fileBadge(file.type);
  const ChevronIcon = collapsed ? ChevronRight : ChevronDown;
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
  const name = path.slice(dir.length);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center gap-2 border-b bg-card/95 px-3 py-2 text-xs backdrop-blur supports-[backdrop-filter]:bg-card/80",
        viewed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => {
          setCollapsed(path, !collapsed);
        }}
        className="-ml-1 inline-flex size-5 items-center justify-center rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={collapsed ? `Expand ${path}` : `Collapse ${path}`}
        aria-expanded={!collapsed}
      >
        <ChevronIcon className="size-3.5" />
      </button>
      <span
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded text-[0.65rem] font-bold",
          badge.className,
        )}
        title={badge.title}
      >
        {badge.label}
      </span>
      <span className="truncate font-mono" title={path}>
        <span className="text-muted-foreground">{dir}</span>
        <span className="text-foreground">{name}</span>
      </span>
      <span className="ml-1 shrink-0 font-mono text-[0.7rem]" aria-label={`${String(adds)} additions, ${String(dels)} deletions`}>
        <span className="text-emerald-600 dark:text-emerald-400">+{adds}</span>
        <span className="ml-1 text-red-600 dark:text-red-400">−{dels}</span>
      </span>
      {isLargeFile(file) && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
          large
        </span>
      )}
      {askCount > 0 && (
        <span
          className="shrink-0 rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground"
          title={`${String(askCount)} comment${askCount === 1 ? "" : "s"}`}
        >
          {askCount}
        </span>
      )}
      <button
        type="button"
        onClick={() => {
          toggleViewed(path);
        }}
        aria-pressed={viewed}
        className={cn(
          "ml-auto flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          viewed
            ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
            : "hover:bg-accent",
        )}
      >
        <span
          className={cn(
            "inline-flex size-3.5 items-center justify-center rounded-sm border",
            viewed ? "border-emerald-600 bg-emerald-600 text-white" : "border-input",
          )}
          aria-hidden="true"
        >
          {viewed && <Check className="size-2.5" strokeWidth={3} />}
        </span>
        <span>Viewed</span>
      </button>
    </header>
  );
};

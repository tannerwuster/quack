import { Columns2, Rows3, WrapText } from "lucide-react";
import { useStore, type ViewMode } from "@/lib/store";
import { cn } from "@/lib/utils";

const MODES: { mode: ViewMode; label: string; Icon: typeof Columns2 }[] = [
  { mode: "split", label: "Split", Icon: Columns2 },
  { mode: "unified", label: "Unified", Icon: Rows3 },
];

export const ViewControls = () => {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const wrapLines = useStore((s) => s.wrapLines);
  const toggleWrap = useStore((s) => s.toggleWrap);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center rounded-md border p-0.5"
        role="radiogroup"
        aria-label="Diff layout"
      >
        {MODES.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={viewMode === mode}
            onClick={() => {
              setViewMode(mode);
            }}
            title={`${label} view`}
            className={cn(
              "flex h-6 items-center gap-1 rounded px-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              viewMode === mode
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleWrap}
        aria-pressed={wrapLines}
        title={wrapLines ? "Disable line wrap" : "Wrap long lines"}
        className={cn(
          "flex size-7 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          wrapLines
            ? "border-primary/40 bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <WrapText className="size-3.5" aria-hidden />
        <span className="sr-only">Wrap long lines</span>
      </button>
    </div>
  );
};

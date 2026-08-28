import { useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useStore } from "@/lib/store";
import { modKeyLabel } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { SettingsMenu } from "./SettingsMenu";
import { ThemeEditor } from "./ThemeEditor";
import { statusItemClass } from "./status-item";

const SidebarToggle = () => {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const Icon = collapsed ? PanelLeft : PanelLeftClose;
  const label = collapsed ? "Show file tree" : "Hide file tree";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-expanded={!collapsed}
      aria-label={label}
      title={`${label} (${modKeyLabel()}B)`}
      className={statusItemClass}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
};

const Connection = () => {
  const conn = useStore((s) => s.conn);
  const label =
    conn.state === "open"
      ? "Connected"
      : conn.state === "connecting"
        ? "Connecting"
        : "Disconnected";
  const color =
    conn.state === "open"
      ? "bg-emerald-500"
      : conn.state === "connecting"
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <span
      className="flex h-full items-center gap-1.5 px-2 text-[0.7rem] text-muted-foreground"
      title={label}
    >
      <span className={cn("inline-block size-2 rounded-full", color)} aria-hidden />
      <span className="hidden sm:inline" role="status">
        {label}
      </span>
    </span>
  );
};

// Truncate to a git-short-sha-style ID. Full UUID lives in the title
// attribute for hover/copy.
const truncSession = (sid: string) =>
  sid.length > 12 ? `${sid.slice(0, 4)}…${sid.slice(-4)}` : sid;

const Session = () => {
  const sessionId = useStore((s) => s.sessionId);
  if (!sessionId) return null;
  return (
    <span
      className="hidden h-full items-center px-2 font-mono text-[0.7rem] text-muted-foreground md:flex"
      title={`Comments are answered in Claude Code session ${sessionId}`}
    >
      {truncSession(sessionId)}
    </span>
  );
};

/**
 * IDE-style status bar pinned to the bottom of the window: the file-tree
 * toggle on the left, and on the right everything that describes the
 * session rather than the diff — which is why these moved off the top bar,
 * leaving it to the review source and the diff-view controls.
 */
export const StatusBar = () => {
  const [themeRev, setThemeRev] = useState(0);

  return (
    <footer className="flex h-6 shrink-0 items-stretch border-t bg-card text-[0.7rem]">
      <SidebarToggle />
      <div className="ml-auto flex items-stretch">
        <Session />
        <SettingsMenu rev={themeRev} />
        <ThemeEditor
          onSaved={() => {
            setThemeRev((r) => r + 1);
          }}
        />
        <Connection />
      </div>
    </footer>
  );
};

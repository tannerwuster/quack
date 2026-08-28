import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { parseReviewSource } from "@/lib/review-source";
import { ThemePicker } from "./ThemePicker";
import { ThemeEditor } from "./ThemeEditor";
import { ViewControls } from "./ViewControls";
import { ReviewSourceChip } from "./ReviewSourceChip";
import { QuackLogo } from "./QuackLogo";
import { KeyboardHelp } from "./KeyboardHelp";
import { cn } from "@/lib/utils";

const ConnectionDot = () => {
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
    <span className="flex items-center gap-1.5" title={label}>
      <span
        className={cn("inline-block size-2 rounded-full", color)}
        aria-hidden="true"
      />
      <span className="sr-only" role="status">
        {label}
      </span>
    </span>
  );
};

// Truncate to a git-short-sha-style ID. Full UUID lives in the title
// attribute for hover/copy.
const truncSession = (sid: string) =>
  sid.length > 12 ? `${sid.slice(0, 4)}…${sid.slice(-4)}` : sid;

export const TopBar = () => {
  const project = useStore((s) => s.project);
  const protocol = useStore((s) => s.protocol);
  const diffLabel = useStore((s) => s.diff?.label);
  const hasDiff = useStore((s) => s.diff !== undefined);
  const sessionId = useStore((s) => s.sessionId);
  const [themeRev, setThemeRev] = useState(0);

  // Always advertise *what* the user is reviewing — when the skill didn't
  // pre-compute a diff, the server falls back to the working tree, so that
  // becomes the implicit label.
  const label = diffLabel ?? (protocol ? "Working tree" : undefined);
  const source = useMemo(() => parseReviewSource(label), [label]);

  const projectName = project?.split("/").filter(Boolean).pop() ?? project;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <QuackLogo />
        {label && (
          // meta is the extension point for real pull-request details
          // (title/number/author/status). The current protocol never sends
          // them, so we pass nothing rather than inventing data.
          <ReviewSourceChip source={source} meta={undefined} />
        )}
      </div>

      {project && (
        <span
          className="hidden min-w-0 max-w-[16rem] items-center truncate font-mono text-[0.7rem] text-muted-foreground lg:flex"
          title={project}
        >
          {projectName}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {hasDiff && <ViewControls />}
        {sessionId && (
          <span
            className="hidden font-mono text-[0.65rem] text-muted-foreground xl:inline"
            title={`Comments are answered in Claude Code session ${sessionId}`}
          >
            {truncSession(sessionId)}
          </span>
        )}
        <div className="flex items-center gap-1">
          <KeyboardHelp />
          <ThemePicker rev={themeRev} />
          <ThemeEditor
            onSaved={() => {
              setThemeRev((r) => r + 1);
            }}
          />
        </div>
        <ConnectionDot />
      </div>
    </header>
  );
};

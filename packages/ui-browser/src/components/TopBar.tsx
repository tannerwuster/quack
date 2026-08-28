import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { parseReviewSource } from "@/lib/review-source";
import { ViewControls } from "./ViewControls";
import { ReviewSourceChip } from "./ReviewSourceChip";
import { QuackLogo } from "./QuackLogo";

export const TopBar = () => {
  const project = useStore((s) => s.project);
  const protocol = useStore((s) => s.protocol);
  const diffLabel = useStore((s) => s.diff?.label);
  const hasDiff = useStore((s) => s.diff !== undefined);

  // Always advertise *what* the user is reviewing — when the skill didn't
  // pre-compute a diff, the server falls back to the working tree, so that
  // becomes the implicit label.
  const label = diffLabel ?? (protocol ? "Working tree" : undefined);
  const source = useMemo(() => parseReviewSource(label), [label]);

  const projectName = project?.split("/").filter(Boolean).pop() ?? project;

  return (
    // What the user is reviewing, and how it's laid out. Everything about
    // the session rather than the diff — theme, shortcuts, version,
    // connection — lives in the bottom status bar.
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
      </div>
    </header>
  );
};

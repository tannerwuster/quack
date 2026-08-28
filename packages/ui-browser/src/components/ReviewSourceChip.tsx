import {
  FileDiff,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
} from "lucide-react";
import {
  describeReviewSource,
  type ReviewMeta,
  type ReviewSource,
} from "@/lib/review-source";
import { cn } from "@/lib/utils";

const ICONS = {
  "git-branch": GitBranch,
  "git-pull-request": GitPullRequest,
  "git-commit": GitCommitHorizontal,
  "file-diff": FileDiff,
} as const;

const STATUS_STYLES: Record<NonNullable<ReviewMeta["status"]>, string> = {
  open: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300",
  draft: "bg-muted text-muted-foreground",
  merged: "bg-primary/15 text-primary",
  closed: "bg-destructive/15 text-destructive",
};

/**
 * Identifies what's being reviewed. Driven by the parsed diff label; for a
 * branch comparison it takes a pull-request shape. `meta` is the clean
 * extension point for real PR data (title/number/author/status) — the
 * current protocol never provides it, so nothing is faked: absent fields
 * simply don't render.
 */
export const ReviewSourceChip = ({
  source,
  meta,
}: {
  source: ReviewSource;
  meta?: ReviewMeta | undefined;
}) => {
  const d = describeReviewSource(source);
  const Icon = ICONS[d.icon];

  return (
    <div
      className="flex min-w-0 items-center gap-2 text-xs"
      aria-label={`Reviewing: ${d.kind}${d.head ? ` ${d.head}` : ""}`}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 font-medium">{d.kind}</span>
        {meta?.number !== undefined && (
          <span className="shrink-0 font-mono text-muted-foreground">
            #{meta.number}
          </span>
        )}
        {meta?.status && (
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-medium capitalize",
              STATUS_STYLES[meta.status],
            )}
          >
            {meta.status}
          </span>
        )}
        {(d.head ?? meta?.head) && (
          <span className="flex min-w-0 items-center gap-1 font-mono text-muted-foreground">
            <span className="truncate rounded bg-muted px-1.5 py-0.5 text-foreground">
              {meta?.head ?? d.head}
            </span>
            {(d.base ?? meta?.base) && (
              <>
                <span aria-hidden>←</span>
                <span className="truncate rounded bg-muted px-1.5 py-0.5">
                  {meta?.base ?? d.base}
                </span>
              </>
            )}
          </span>
        )}
      </div>
      {meta?.title && (
        <span className="truncate text-muted-foreground" title={meta.title}>
          {meta.title}
        </span>
      )}
    </div>
  );
};

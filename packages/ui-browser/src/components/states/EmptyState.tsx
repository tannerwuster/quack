import type { ReactNode } from "react";
import { FilterX, SearchX } from "lucide-react";
import { PixelDuck } from "../PixelDuck";
import { Button } from "../ui/button";
import { useStore } from "@/lib/store";

type Kind = "clean" | "no-match";

// Empty states for the diff area. "clean" = nothing to review (a calm,
// satisfied duck); "no-match" = the active filter hid everything.
export const EmptyState = ({ kind }: { kind: Kind }) => {
  const clearFilter = useStore((s) => s.clearFilter);

  if (kind === "no-match") {
    return (
      <Shell
        icon={<SearchX className="absolute -bottom-1 -right-1 size-5 text-muted-foreground" aria-hidden />}
        title="No files match your filter"
        sub="Try a different name, or clear the filters to see everything."
      >
        <Button variant="outline" size="sm" onClick={clearFilter}>
          <FilterX className="mr-1.5 size-3.5" />
          Clear filters
        </Button>
      </Shell>
    );
  }

  return (
    <Shell
      title="Nothing to review — all clear"
      sub="The working tree is clean. Make some changes and re-run /quack, and your duck will be waiting."
    />
  );
};

const Shell = ({
  icon,
  title,
  sub,
  children,
}: {
  icon?: ReactNode;
  title: string;
  sub: string;
  children?: ReactNode;
}) => (
  <div
    className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"
    role="status"
    aria-live="polite"
  >
    <div className="relative">
      <PixelDuck className="size-16 opacity-90" />
      {icon}
    </div>
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 max-w-sm text-xs text-muted-foreground">{sub}</div>
    </div>
    {children}
  </div>
);

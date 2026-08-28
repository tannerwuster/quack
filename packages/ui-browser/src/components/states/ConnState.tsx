import { PlugZap, RefreshCw } from "lucide-react";
import { PixelDuck } from "../PixelDuck";
import { QuackSpinner } from "../QuackSpinner";
import { Button } from "../ui/button";

type Kind = "loading" | "connecting" | "disconnected";

// Connection / loading placeholder shown in the diff area. Restrained duck
// presence: a static mascot plus a clear status line and (when relevant) a
// retry. Announced politely for screen readers.
export const ConnState = ({
  kind,
  detail,
}: {
  kind: Kind;
  project?: string | undefined;
  detail?: string | undefined;
}) => {
  const title =
    kind === "disconnected" ? "Disconnected" : "Loading…";

  const sub =
    kind === "disconnected"
      ? detail
        ? `${detail}. Reconnecting automatically…`
        : "Reconnecting automatically…"
      : undefined;

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"
      role="status"
      aria-live="polite"
    >
      {kind === "disconnected" ? (
        <div className="relative">
          <PixelDuck className="size-16 opacity-90" />
          <PlugZap className="absolute -bottom-1 -right-1 size-5 text-destructive" aria-hidden />
        </div>
      ) : (
        <QuackSpinner className="w-64 max-w-[70vw]" />
      )}
      <div>
        <div className="text-sm font-medium">{title}</div>
        {sub && <div className="mt-1 max-w-sm text-xs text-muted-foreground">{sub}</div>}
      </div>
      {kind === "disconnected" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            location.reload();
          }}
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Reload
        </Button>
      )}
    </div>
  );
};

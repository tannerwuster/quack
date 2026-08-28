import { cn } from "@/lib/utils";

// The shared pixel-duck artwork. Geometry sits on a four-unit grid so the
// duck stays crisp at any rendered size. Colors come from the --duck-*
// theme tokens (see globals.css) so the mascot adapts to every theme.
// QuackLogo wraps this with interaction; empty/loading states reuse it
// as a static illustration.
export const PixelDuck = ({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) => (
  <svg
    viewBox="0 0 64 64"
    role={title ? "img" : "presentation"}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    shapeRendering="crispEdges"
    className={cn("quack-duck", className)}
  >
    <path
      className="quack-logo__ink"
      d="M16 8h24v4h8v8h4v8h8v16H48v4h-4v12H16v-4h-4V44h4v-8h-4V16h4z"
    />
    <path
      className="quack-logo__head"
      d="M20 12h16v4h8v8h4v8h-8v8h-4v8h4v8H20v-4h-4v-8h4V36h-4V20h4z"
    />
    <path
      className="quack-logo__head-shadow"
      d="M16 28h4v12h4v4h-4v8h20v4H20v-4h-4V44h4v-8h-4z"
    />
    <path className="quack-logo__bill" d="M40 28h8v4h8v8H44v-4h-8v-4h4z" />
    <path className="quack-logo__eye" d="M32 20h8v8h-8z" />
  </svg>
);

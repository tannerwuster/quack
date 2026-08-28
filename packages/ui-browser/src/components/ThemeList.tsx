import { Check } from "lucide-react";
import { useTheme, type ThemeName } from "@/hooks/use-theme";
import { activateCustomTheme, activeCustomThemeName, loadCustomThemes } from "@/lib/palette";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  quack: "Quack",
  duckhunt: "Duck Hunt",
  dracula: "Dracula",
  cosmicgirl: "Cosmic Girl",
};

/** Human name of the theme in effect — the status bar shows this. */
export const currentThemeLabel = (): string => {
  const attr = document.documentElement.getAttribute("data-theme") ?? "light";
  if (attr === "custom") return activeCustomThemeName() ?? "Custom";
  return LABELS[attr as ThemeName] ?? attr;
};

const Row = ({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      selected && "bg-accent font-medium text-accent-foreground",
    )}
  >
    <Check
      className={cn("size-3.5 shrink-0 text-primary", !selected && "invisible")}
      aria-hidden
    />
    <span className="truncate">{label}</span>
  </button>
);

/**
 * Theme chooser rows. Presentational — the caller owns the surface it sits
 * on, and must re-render when the menu opens so the tick reflects the
 * live `data-theme` rather than whichever theme was active last render.
 */
export const ThemeList = ({ onPicked }: { onPicked?: () => void }) => {
  const { theme, setTheme, themes } = useTheme();
  const customs = loadCustomThemes();
  const current = document.documentElement.getAttribute("data-theme") ?? theme;
  const activeCustom = activeCustomThemeName();

  return (
    <div role="radiogroup" aria-label="Theme">
      {themes.map((t) => (
        <Row
          key={t}
          label={LABELS[t]}
          selected={current === t}
          onSelect={() => {
            setTheme(t);
            onPicked?.();
          }}
        />
      ))}
      {Object.keys(customs).length > 0 && <div className="my-1 border-t" />}
      {Object.entries(customs).map(([nm, p]) => (
        <Row
          key={nm}
          label={nm}
          selected={current === "custom" && activeCustom === nm}
          onSelect={() => {
            activateCustomTheme(p, nm);
            onPicked?.();
          }}
        />
      ))}
    </div>
  );
};

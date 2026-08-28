import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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

export const ThemePicker = ({ rev = 0 }: { rev?: number }) => {
  const { theme, setTheme, themes } = useTheme();
  // Controlling `open` is what keeps the tick mark honest: the list is built
  // during this component's render, so it has to re-render when the popover
  // opens or it would show whichever theme was active at the last render.
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const bump = () => {
    setTick((x) => x + 1);
  };

  // rev (bumped when the editor saves) and tick force a re-read of the
  // current attribute + saved themes.
  void rev;
  const customs = loadCustomThemes();
  const current = document.documentElement.getAttribute("data-theme") ?? theme;
  const activeCustom = activeCustomThemeName();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 px-0"
          aria-label="Theme"
        >
          <Palette className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <div role="radiogroup" aria-label="Theme">
          {themes.map((t) => (
            <Row
              key={t}
              label={LABELS[t]}
              selected={current === t}
              onSelect={() => {
                setTheme(t);
                bump();
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
                bump();
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

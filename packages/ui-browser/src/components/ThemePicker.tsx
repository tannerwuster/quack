import { useState } from "react";
import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeName } from "@/hooks/use-theme";
import { activateCustomTheme, loadCustomThemes } from "@/lib/palette";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  quack: "Quack",
  duckhunt: "Duck Hunt",
  dracula: "Dracula",
  cosmicgirl: "Cosmic Girl",
};

export const ThemePicker = ({ rev = 0 }: { rev?: number }) => {
  const { theme, setTheme, themes } = useTheme();
  const [, setTick] = useState(0);
  const bump = () => {
    setTick((x) => x + 1);
  };

  // rev (bumped when the editor saves) and tick force a re-read of the
  // current attribute + saved themes.
  void rev;
  const customs = loadCustomThemes();
  const current = document.documentElement.getAttribute("data-theme") ?? theme;

  return (
    <Popover>
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
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTheme(t);
              bump();
            }}
            className={cn(
              "flex w-full items-center rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
              current === t && "font-medium",
            )}
          >
            {LABELS[t]}
          </button>
        ))}
        {Object.keys(customs).length > 0 && (
          <div className="my-1 border-t" />
        )}
        {Object.entries(customs).map(([nm, p]) => (
          <button
            key={nm}
            type="button"
            onClick={() => {
              activateCustomTheme(p);
              bump();
            }}
            className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
          >
            {nm}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

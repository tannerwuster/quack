import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeName } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  dracula: "Dracula",
  cosmicgirl: "Cosmic Girl",
};

export const ThemePicker = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2"
          aria-label="Theme"
        >
          <Palette className="size-4" />
          <span className="text-xs">{LABELS[theme]}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTheme(t);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
              t === theme && "font-medium",
            )}
          >
            {LABELS[t]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { PixelDuck } from "./PixelDuck";
import { ThemeList, currentThemeLabel } from "./ThemeList";
import { ShortcutList } from "./ShortcutList";
import { statusItemClass } from "./status-item";

const Heading = ({ children }: { children: string }) => (
  <div className="mb-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
    {children}
  </div>
);

/**
 * The status bar's one settings surface: theme picker, shortcut reference
 * and the running quack version, side by side. Open state lives in the
 * store so the "?" shortcut can toggle it — and so the whole menu
 * re-renders on open, which is what keeps the theme tick current.
 */
export const SettingsMenu = ({ rev = 0 }: { rev?: number }) => {
  const open = useStore((s) => s.settingsOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const version = useStore((s) => s.serverVersion);

  // rev is bumped when the theme editor saves, so a newly created theme
  // shows up in the list without reopening the menu.
  void rev;
  const themeLabel = currentThemeLabel();

  return (
    <Popover open={open} onOpenChange={setSettingsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={statusItemClass}
          aria-label={`Settings — theme: ${themeLabel}`}
          title="Theme, shortcuts and version (?)"
        >
          <Palette className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{themeLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        // This is a reference panel, not a task dialog. Letting Radix focus
        // the first theme row would paint a ring on it that reads as a
        // second selection next to the real check mark.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        className="w-[30rem] max-w-[calc(100vw-1rem)] p-0"
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <PixelDuck className="size-4" />
          <span className="text-xs font-medium">quack</span>
          <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground">
            {version ? `v${version}` : "dev build"}
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 p-3">
          <div>
            <Heading>Theme</Heading>
            <ThemeList />
          </div>
          <div>
            <Heading>Keyboard</Heading>
            <ShortcutList />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

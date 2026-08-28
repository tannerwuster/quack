import { Keyboard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { modKeyLabel } from "@/lib/platform";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: [`${modKeyLabel()}B`], label: "Toggle file tree" },
  { keys: ["j", "]"], label: "Next file" },
  { keys: ["k", "["], label: "Previous file" },
  { keys: ["n"], label: "Next unresolved comment" },
  { keys: ["p"], label: "Previous unresolved comment" },
  { keys: ["v"], label: "Toggle viewed" },
  { keys: ["e"], label: "Expand / collapse file" },
  { keys: ["u"], label: "Toggle split / unified" },
  { keys: ["w"], label: "Toggle line wrap" },
  { keys: ["/"], label: "Filter files" },
  { keys: ["?"], label: "Toggle this help" },
];

const Key = ({ children }: { children: string }) => (
  <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
    {children}
  </kbd>
);

export const KeyboardHelp = () => {
  const open = useStore((s) => s.helpOpen);
  const setHelpOpen = useStore((s) => s.setHelpOpen);

  return (
    <Popover open={open} onOpenChange={setHelpOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 px-0"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
          Keyboard shortcuts
        </div>
        <ul className="space-y-0.5">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-2 rounded px-1 py-1 text-xs"
            >
              <span>{s.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {s.keys.map((k) => (
                  <Key key={k}>{k}</Key>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

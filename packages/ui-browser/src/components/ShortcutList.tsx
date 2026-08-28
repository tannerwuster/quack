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
  { keys: ["?"], label: "Toggle this menu" },
];

const Key = ({ children }: { children: string }) => (
  <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
    {children}
  </kbd>
);

/** Reference table of the review shortcuts. Presentational. */
export const ShortcutList = () => (
  <ul className="space-y-0.5">
    {SHORTCUTS.map((s) => (
      <li
        key={s.label}
        className="flex items-center justify-between gap-3 rounded py-1 text-xs"
      >
        <span className="text-muted-foreground">{s.label}</span>
        <span className="flex shrink-0 items-center gap-1">
          {s.keys.map((k) => (
            <Key key={k}>{k}</Key>
          ))}
        </span>
      </li>
    ))}
  </ul>
);

import { useEffect, useState } from "react";
import { Loader2, SwatchBook, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import {
  derivePalette,
  paletteFromConfig,
  previewCustomTheme,
  activateCustomTheme,
  saveCustomTheme,
  type Palette,
} from "@/lib/palette";

export const ThemeEditor = ({ onSaved }: { onSaved?: () => void }) => {
  const [primary, setPrimary] = useState("#bd93f9");
  const [secondary, setSecondary] = useState("#8be9fd");
  const [name, setName] = useState("");
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette>(() =>
    derivePalette("#bd93f9", "#8be9fd"),
  );
  const [refineId, setRefineId] = useState<string | null>(null);
  const themeGen = useStore((s) => s.themeGen);
  const startThemeGen = useStore((s) => s.startThemeGen);
  const refining =
    refineId !== null && themeGen?.id === refineId && themeGen.status === "pending";

  const preview = (p: Palette) => {
    setPalette(p);
    previewCustomTheme(p);
  };

  // Resolve a "Refine with Claude" round-trip: apply the returned palette,
  // or surface the error and keep the deterministic one already applied.
  useEffect(() => {
    if (refineId === null || themeGen?.id !== refineId) return;
    if (themeGen.status === "done" && themeGen.palette) {
      setPalette(themeGen.palette);
      previewCustomTheme(themeGen.palette);
      setError(null);
      setRefineId(null);
    } else if (themeGen.status === "error") {
      setError(themeGen.error ?? "Theme generation failed");
      setRefineId(null);
    }
  }, [themeGen, refineId]);

  const refine = () => {
    setError(null);
    setRefineId(startThemeGen(primary, secondary));
  };

  const onColor = (which: "primary" | "secondary", val: string) => {
    const p = which === "primary" ? val : primary;
    const s = which === "secondary" ? val : secondary;
    if (which === "primary") setPrimary(val);
    else setSecondary(val);
    try {
      preview(derivePalette(p, s));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const applyPaste = () => {
    try {
      const parsed = paletteFromConfig(paste);
      preview({ ...palette, ...parsed });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const save = () => {
    const nm = name.trim() || "Custom";
    saveCustomTheme(nm, palette);
    activateCustomTheme(palette);
    onSaved?.();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 px-0"
          aria-label="Create custom theme"
        >
          <SwatchBook className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3 text-xs">
        <div className="font-medium">New custom theme</div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5">
            Primary
            <input
              type="color"
              value={primary}
              onChange={(e) => {
                onColor("primary", e.target.value);
              }}
              className="h-6 w-8 cursor-pointer rounded border"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Secondary
            <input
              type="color"
              value={secondary}
              onChange={(e) => {
                onColor("secondary", e.target.value);
              }}
              className="h-6 w-8 cursor-pointer rounded border"
            />
          </label>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full gap-1.5"
          onClick={refine}
          disabled={refining}
        >
          {refining ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {refining ? "Refining…" : "Refine with Claude"}
        </Button>
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Paste a config
          </summary>
          <Textarea
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
            }}
            rows={4}
            placeholder={'{"background":"#0e1419"} or --background: #0e1419;'}
            className="mt-2 font-mono text-[0.7rem]"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-6"
            onClick={applyPaste}
          >
            Apply pasted
          </Button>
        </details>
        {error && <div className="text-destructive">{error}</div>}
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Name"
            className="h-7"
          />
          <Button size="sm" className="h-7" onClick={save}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

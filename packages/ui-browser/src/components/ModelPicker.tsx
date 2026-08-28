import { Check, ChevronDown, Cpu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore, ASK_MODEL_OPTIONS } from "@/lib/store";
import { cn } from "@/lib/utils";

// Compact model selector for the comment composer. Sets the (persisted)
// model new asks are sent on — letting you drop a single question onto a
// lighter model (Haiku) without restarting the server. "Session default"
// sends no override, so the server answers on the review session's model.
export const ModelPicker = () => {
  const askModel = useStore((s) => s.askModel);
  const setAskModel = useStore((s) => s.setAskModel);

  const current =
    ASK_MODEL_OPTIONS.find((o) => o.value === askModel) ?? ASK_MODEL_OPTIONS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Model this question is answered on"
        >
          <Cpu className="size-3.5" aria-hidden />
          <span className="max-w-24 truncate">{current?.label}</span>
          <ChevronDown className="size-3 opacity-60" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="px-2 py-1 text-[0.7rem] font-medium text-muted-foreground">
          Answer with
        </div>
        {ASK_MODEL_OPTIONS.map((opt) => {
          const active = opt.value === askModel;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setAskModel(opt.value);
              }}
              aria-pressed={active}
              className={cn(
                "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                active && "bg-accent/60",
              )}
            >
              <Check
                className={cn("mt-0.5 size-3.5 shrink-0", active ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="font-medium">{opt.label}</span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

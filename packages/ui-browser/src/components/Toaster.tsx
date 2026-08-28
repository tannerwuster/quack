import { useEffect } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useStore, type ToastLevel } from "@/lib/store";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 6000;

const ToastItem = ({
  id,
  message,
  level,
}: {
  id: string;
  message: string;
  level: ToastLevel;
}) => {
  const dismiss = useStore((s) => s.dismissToast);

  useEffect(() => {
    const t = setTimeout(() => {
      dismiss(id);
    }, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(t);
    };
  }, [id, dismiss]);

  const isError = level === "error";
  const Icon = isError ? AlertTriangle : Info;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-md",
        isError ? "border-destructive/40 text-destructive" : "border-border text-foreground",
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          dismiss(id);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};

export const Toaster = () => {
  const toasts = useStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} message={t.message} level={t.level} />
      ))}
    </div>
  );
};

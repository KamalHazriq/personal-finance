"use client";

import * as React from "react";
import { TOAST_EVENT, type ToastEvent } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<ToastEvent>).detail;
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-2 fade-in-0 bg-background",
            t.type === "success" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
            t.type === "error" && "border-destructive/30 text-destructive",
            t.type === "info" && "border-border text-foreground"
          )}
        >
          {t.type === "success" && <CheckCircle2 className="size-4 shrink-0" />}
          {t.type === "error" && <XCircle className="size-4 shrink-0" />}
          {t.type === "info" && <Info className="size-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-50 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

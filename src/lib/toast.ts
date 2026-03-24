// Lightweight toast utility using custom events
// This avoids needing an external dependency like sonner

type ToastType = "success" | "error" | "info";

interface ToastEvent {
  message: string;
  type: ToastType;
}

const TOAST_EVENT = "app:toast";

export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<ToastEvent>(TOAST_EVENT, {
          detail: { message, type: "success" },
        })
      );
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<ToastEvent>(TOAST_EVENT, {
          detail: { message, type: "error" },
        })
      );
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<ToastEvent>(TOAST_EVENT, {
          detail: { message, type: "info" },
        })
      );
    }
  },
};

export { TOAST_EVENT };
export type { ToastEvent };

export const TOAST_EVENT = "kashki:toast";

export type ToastType = "success" | "error";

export type ToastNotice = {
  type: ToastType;
  message: string;
};

export function dispatchToast(type: ToastType, message: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastNotice>(TOAST_EVENT, {
      detail: { type, message },
    }),
  );
}

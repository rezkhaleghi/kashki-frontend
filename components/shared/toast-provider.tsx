"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { TOAST_EVENT, type ToastNotice } from "@/lib/toasts";

type ToastItem = ToastNotice & { id: number };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const activeTimers = timers.current;

    function dismiss(id: number) {
      const timer = activeTimers.get(id);
      if (timer !== undefined) window.clearTimeout(timer);
      activeTimers.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }

    function handleToast(event: Event) {
      const notice = (event as CustomEvent<ToastNotice>).detail;
      const id = ++nextId.current;

      setToasts((current) => [...current, { ...notice, id }].slice(-4));
      activeTimers.set(
        id,
        window.setTimeout(
          () => dismiss(id),
          notice.type === "error" ? 8000 : 5000,
        ),
      );
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  function dismiss(id: number) {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const Icon = isError ? CircleAlert : CheckCircle2;

          return (
            <div
              key={toast.id}
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${isError ? "border-rose-200 text-rose-950" : "border-emerald-200 text-emerald-950"}`}
            >
              <Icon
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${isError ? "text-rose-600" : "text-emerald-700"}`}
                size={19}
              />
              <p className="min-w-0 flex-1 break-words text-sm font-medium leading-5">
                {toast.message}
              </p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 -mt-1 rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { toastStore, toast, type ToastItem, type ToastType, type ToastOptions } from "@/lib/toast";

interface ToastContextValue {
  toast: typeof toast;
  toasts: ToastItem[];
  dismiss: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
}

const defaultContextValue: ToastContextValue = {
  toast,
  toasts: [],
  dismiss: (id: string) => toastStore.dismiss(id),
  pause: (id: string) => toastStore.pause(id),
  resume: (id: string) => toastStore.resume(id),
};

const ToastContext = createContext<ToastContextValue>(defaultContextValue);

export function useToast() {
  return useContext(ToastContext);
}

function getToastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-brand shrink-0 mt-0.5" aria-hidden="true" />;
  }
}

function getBorderAccentClass(type: ToastType) {
  switch (type) {
    case "success":
      return "border-l-4 border-l-emerald-600";
    case "error":
      return "border-l-4 border-l-red-600";
    case "warning":
      return "border-l-4 border-l-amber-500";
    case "info":
    default:
      return "border-l-4 border-l-brand";
  }
}

function ToastCard({
  item,
  onDismiss,
  onPause,
  onResume,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  const isError = item.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      tabIndex={0}
      onMouseEnter={() => onPause(item.id)}
      onMouseLeave={() => onResume(item.id)}
      onFocus={() => onPause(item.id)}
      onBlur={() => onResume(item.id)}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-steel-200 bg-white p-4 shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${getBorderAccentClass(item.type)}`}
    >
      {getToastIcon(item.type)}
      <div className="flex-1 pr-1 min-w-0">
        {item.title ? (
          <h4 className="text-sm font-semibold text-steel-900 leading-snug">{item.title}</h4>
        ) : null}
        <p className="text-sm text-steel-800 leading-snug break-words">{item.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 p-1 rounded text-steel-400 hover:text-steel-700 hover:bg-steel-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

const EMPTY_TOASTS: ToastItem[] = [];
const getServerSnapshot = () => EMPTY_TOASTS;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    getServerSnapshot
  );

  const contextValue: ToastContextValue = {
    toast,
    toasts,
    dismiss: (id: string) => toastStore.dismiss(id),
    pause: (id: string) => toastStore.pause(id),
    resume: (id: string) => toastStore.resume(id),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Notification Container: Fixed position top-right, responsive on mobile */}
      <div
        aria-label="Notifications"
        role="region"
        className="pointer-events-none fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full sm:w-96"
      >
        {toasts.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            onDismiss={contextValue.dismiss}
            onPause={contextValue.pause}
            onResume={contextValue.resume}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { toast };
export type { ToastItem, ToastType, ToastOptions };

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  title?: string;
  duration?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  remainingTime: number;
  createdAt: number;
  isPaused: boolean;
}

export const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 4000, // 3-5s requirement
  info: 4000,    // 3-5s requirement
  warning: 6000, // appropriate warning duration
  error: 7000,   // 6-8s requirement
};

type ToastListener = (toasts: ToastItem[]) => void;

interface TimerInfo {
  timeoutId: ReturnType<typeof setTimeout> | null;
  startedAt: number;
}

export class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners = new Set<ToastListener>();
  private timers = new Map<string, TimerInfo>();
  private recentMessages = new Map<string, number>();
  private dedupeWindowMs = 2000;
  private idCounter = 0;

  constructor(dedupeWindowMs = 2000) {
    this.dedupeWindowMs = dedupeWindowMs;
  }

  public subscribe = (listener: ToastListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): ToastItem[] => {
    return this.toasts;
  };

  private notify() {
    const snapshot = [...this.toasts];
    this.listeners.forEach((listener) => listener(snapshot));
  }

  public add(type: ToastType, message: string, options?: ToastOptions): string | null {
    const trimmed = (message || "").trim();
    if (!trimmed) return null;

    const now = Date.now();
    const dedupeKey = `${type}:${trimmed}`;
    const lastSeen = this.recentMessages.get(dedupeKey);

    // Prevent duplicate notifications from the same action within dedupeWindowMs
    if (lastSeen && now - lastSeen < this.dedupeWindowMs) {
      const existing = this.toasts.find((t) => t.type === type && t.message === trimmed);
      if (existing) {
        // Reset the timer for the existing toast instead of stacking a duplicate
        this.resetTimer(existing.id);
        return existing.id;
      }
    }

    this.recentMessages.set(dedupeKey, now);

    this.idCounter += 1;
    const id = options?.id ?? `bam-toast-${this.idCounter}-${now}`;
    const duration = options?.duration ?? TOAST_DURATIONS[type];

    const newItem: ToastItem = {
      id,
      type,
      title: options?.title,
      message: trimmed,
      duration,
      remainingTime: duration,
      createdAt: now,
      isPaused: false,
    };

    this.toasts = [...this.toasts, newItem];
    this.scheduleDismiss(id, duration);
    this.notify();
    return id;
  }

  private scheduleDismiss(id: string, delay: number) {
    if (delay <= 0) return;
    this.clearTimer(id);

    const timeoutId = setTimeout(() => {
      this.dismiss(id);
    }, delay);

    this.timers.set(id, {
      timeoutId,
      startedAt: Date.now(),
    });
  }

  private clearTimer(id: string) {
    const info = this.timers.get(id);
    if (info?.timeoutId) {
      clearTimeout(info.timeoutId);
    }
    this.timers.delete(id);
  }

  public pause(id: string) {
    const item = this.toasts.find((t) => t.id === id);
    if (!item || item.isPaused) return;

    const timerInfo = this.timers.get(id);
    if (timerInfo?.timeoutId) {
      clearTimeout(timerInfo.timeoutId);
      const elapsed = Date.now() - timerInfo.startedAt;
      const remaining = Math.max(0, item.remainingTime - elapsed);
      this.timers.delete(id);

      this.toasts = this.toasts.map((t) =>
        t.id === id ? { ...t, isPaused: true, remainingTime: remaining } : t
      );
      this.notify();
    }
  }

  public resume(id: string) {
    const item = this.toasts.find((t) => t.id === id);
    if (!item || !item.isPaused) return;

    this.toasts = this.toasts.map((t) =>
      t.id === id ? { ...t, isPaused: false } : t
    );

    const delay = item.remainingTime > 0 ? item.remainingTime : 1000;
    this.scheduleDismiss(id, delay);
    this.notify();
  }

  public pauseAll() {
    this.toasts.forEach((t) => {
      if (!t.isPaused) this.pause(t.id);
    });
  }

  public resumeAll() {
    this.toasts.forEach((t) => {
      if (t.isPaused) this.resume(t.id);
    });
  }

  private resetTimer(id: string) {
    const item = this.toasts.find((t) => t.id === id);
    if (!item) return;
    this.toasts = this.toasts.map((t) =>
      t.id === id ? { ...t, remainingTime: t.duration, isPaused: false } : t
    );
    this.scheduleDismiss(id, item.duration);
    this.notify();
  }

  public dismiss = (id: string) => {
    this.clearTimer(id);
    const prevLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== prevLen) {
      this.notify();
    }
  };

  public dismissAll = () => {
    this.timers.forEach((info) => {
      if (info.timeoutId) clearTimeout(info.timeoutId);
    });
    this.timers.clear();
    if (this.toasts.length > 0) {
      this.toasts = [];
      this.notify();
    }
  };
}

// Global singleton instance for admin application
export const toastStore = new ToastStore();

// Unified toast dispatch API
export const toast = {
  success: (message: string, options?: ToastOptions) => toastStore.add("success", message, options),
  error: (message: string, options?: ToastOptions) => toastStore.add("error", message, options),
  warning: (message: string, options?: ToastOptions) => toastStore.add("warning", message, options),
  info: (message: string, options?: ToastOptions) => toastStore.add("info", message, options),
  dismiss: (id: string) => toastStore.dismiss(id),
  dismissAll: () => toastStore.dismissAll(),
};

// Listen to browser custom events for decoupling if needed
if (typeof window !== "undefined") {
  window.addEventListener("bam:toast", (event: Event) => {
    const customEvent = event as CustomEvent<{
      type: ToastType;
      message: string;
      options?: ToastOptions;
    }>;
    if (customEvent.detail) {
      const { type, message, options } = customEvent.detail;
      toastStore.add(type || "info", message, options);
    }
  });
}

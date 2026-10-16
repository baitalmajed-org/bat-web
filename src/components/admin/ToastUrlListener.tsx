"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseUrlToast, cleanUrlNotificationParams } from "@/lib/toast-url";
import { useToast } from "./ToastProvider";

export default function ToastUrlListener() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const handledKeyRef = useRef<string>("");

  useEffect(() => {
    if (!searchParams) return;
    const searchString = searchParams.toString();
    if (!searchString) return;

    const currentKey = `${pathname}?${searchString}`;
    if (handledKeyRef.current === currentKey) return;

    const feedback = parseUrlToast(pathname, searchParams);
    if (feedback) {
      handledKeyRef.current = currentKey;
      toast[feedback.type](feedback.message);

      // Clean the transient notification parameters from the browser URL bar
      if (typeof window !== "undefined" && window.history?.replaceState) {
        const fullUrl = window.location.pathname + window.location.search + window.location.hash;
        const cleanUrl = cleanUrlNotificationParams(fullUrl);
        if (cleanUrl !== fullUrl) {
          window.history.replaceState(null, "", cleanUrl);
        }
      }
    }
  }, [pathname, searchParams, toast]);

  return null;
}

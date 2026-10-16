"use client";

import React, { useEffect, useRef, useState, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  isDirty?: boolean;
  dirtyConfirmMessage?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[94vw]",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "lg",
  isDirty = false,
  dirtyConfirmMessage = "You have unsaved changes. Are you sure you want to discard them?",
  children,
  footer,
  hideCloseButton = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Save the previously active element and restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setShowDiscardConfirm(false);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus first focusable element inside the modal
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusable.length > 0) {
            focusable[0]?.focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Request close: check if dirty first
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Handle escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleRequestClose();
        }
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showDiscardConfirm, handleRequestClose]);

  if (!mounted || !isOpen) return null;

  const content = (
    <div
      role="region"
      aria-label="Modal backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-steel-900/60 backdrop-blur-[2px] transition-opacity motion-reduce:transition-none"
        onClick={() => {
          if (showDiscardConfirm) return;
          handleRequestClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative flex flex-col w-full ${SIZE_CLASSES[size]} max-h-[90vh] bg-white border border-steel-200 shadow-2xl overflow-hidden focus:outline-none animate-fadeUp motion-reduce:animate-none`}
      >
        {/* Modal Header */}
        <div className="shrink-0 border-b border-steel-200 bg-steel-50/75 px-5 py-4 sm:px-6 flex items-start justify-between gap-4">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-lg font-bold text-steel-900 leading-snug">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-steel-600">
                {description}
              </p>
            ) : null}
          </div>
          {!hideCloseButton ? (
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 p-1.5 rounded text-steel-400 hover:text-steel-700 hover:bg-steel-200/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Modal Body: Independently Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 overscroll-contain">
          {children}
        </div>

        {/* Optional Modal Footer */}
        {footer ? (
          <div className="shrink-0 border-t border-steel-200 bg-steel-50/75 px-5 py-3.5 sm:px-6 flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        ) : null}

        {/* Unsaved changes confirmation dialog overlay */}
        {showDiscardConfirm ? (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            aria-describedby="discard-desc"
            className="absolute inset-0 z-50 flex items-center justify-center bg-steel-900/50 p-4 backdrop-blur-[1px] animate-fadeUp motion-reduce:animate-none"
          >
            <div className="w-full max-w-sm border border-steel-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="rounded bg-amber-100 p-2 text-amber-700 shrink-0">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 id="discard-title" className="text-base font-bold text-steel-900">
                    Discard unsaved changes?
                  </h3>
                  <p id="discard-desc" className="mt-1.5 text-sm text-steel-600">
                    {dirtyConfirmMessage}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="btn-outline !min-h-9 !px-3.5 !py-1 text-xs"
                  autoFocus
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="btn-danger !min-h-9 !px-3.5 !py-1 text-xs"
                >
                  Discard changes
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

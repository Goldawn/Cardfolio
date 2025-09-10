"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SimpleModal.module.css";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export type SimpleModalProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
};

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (locked) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function useRestoreFocus(active: boolean) {
  const last = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (active) {
      last.current = document.activeElement as HTMLElement | null;
    } else {
      last.current?.focus?.();
    }
  }, [active]);
}

export default function SimpleModal({
  open,
  onClose,
  children,
  title,
  showCloseButton = true,
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
}: SimpleModalProps) {
  useBodyScrollLock(open);
  useRestoreFocus(open);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // ESC pour fermer
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  // Focus automatique sur le panneau
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return styles.sizeSm;
      case "lg":
        return styles.sizeLg;
      case "xl":
        return styles.sizeXl;
      case "md":
      default:
        return styles.sizeMd;
    }
  }, [size]);

  if (!open) return null;
  const el = document.body;
  const overlay = (
    <div className={styles.root} aria-hidden={!open}>
      <div
        className={styles.backdrop}
        onClick={() => closeOnBackdrop && onClose()}
      />
      <div className={styles.center}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === "string" ? title : undefined}
          className={[styles.panel, sizeClass, className].filter(Boolean).join(" ")}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          {(title || showCloseButton) && (
            <div className={styles.header}>
              <div className={styles.title}>{title}</div>
              {showCloseButton && (
                <button
                  type="button"
                  aria-label="Fermer la modale"
                  className={styles.closeBtn}
                  onClick={onClose}
                >
                  ×
                </button>
              )}
            </div>
          )}

          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, el);
}

// Helpers optionnels
export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULTS = {
  width: 180,
  height: 250,
  gap: 8,
  enterDelay: 80,
  leaveDelay: 60,
};

export function useHoverPreview(opts = {}) {
  const { width, height, gap, enterDelay, leaveDelay } = { ...DEFAULTS, ...opts };

  const [preview, setPreview] = useState({ open: false, url: "", name: "", top: 0, left: 0 });
  const enterRef = useRef(null);
  const leaveRef = useRef(null);

  const computePositionFromRect = useCallback(
    (rect) => {
      const midY = rect.top + rect.height / 2 + window.scrollY;
      const vw = window.innerWidth || document.documentElement.clientWidth || 0;
      const preferRight = rect.right + gap + width <= vw;
      let left = (preferRight ? rect.right + gap : rect.left - gap - width) + window.scrollX;

      // clamp horizontal si besoin
      left = Math.max(8 + window.scrollX, Math.min(left, vw - width - 8 + window.scrollX));
      return { top: midY, left };
    },
    [gap, width]
  );

  const openAtRect = useCallback(
    ({ url, name = "", rect }) => {
      if (!url || !rect) return;
      clearTimeout(leaveRef.current);
      const { top, left } = computePositionFromRect(rect);
      enterRef.current = setTimeout(() => {
        setPreview({ open: true, url, name, top, left });
      }, enterDelay);
    },
    [computePositionFromRect, enterDelay]
  );

  const close = useCallback(() => {
    clearTimeout(enterRef.current);
    leaveRef.current = setTimeout(() => setPreview((p) => ({ ...p, open: false })), leaveDelay);
  }, [leaveDelay]);

  // Fournit des handlers prêts à poser sur une <tr>
  const getRowHoverHandlers = useCallback(
    ({ url, name }) => ({
      onMouseEnter: (e) => {
        if (!url) return;
        const rect = e.currentTarget.getBoundingClientRect();
        openAtRect({ url, name, rect });
      },
      onMouseLeave: () => close(),
    }),
    [openAtRect, close]
  );

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPreview((p) => ({ ...p, open: false }));
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(enterRef.current);
      clearTimeout(leaveRef.current);
    };
  }, []);

  return useMemo(
    () => ({
      preview,
      width,
      height,
      openAtRect,
      close,
      getRowHoverHandlers,
    }),
    [preview, width, height, openAtRect, close, getRowHoverHandlers]
  );
}

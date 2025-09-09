import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'

interface HoverPreviewOptions {
  width?: number
  height?: number
  gap?: number
  enterDelay?: number
  leaveDelay?: number
}

interface PreviewState {
  open: boolean
  url: string
  name: string
  top: number
  left: number
}

const DEFAULTS: Required<HoverPreviewOptions> = {
  width: 180,
  height: 250,
  gap: 8,
  enterDelay: 80,
  leaveDelay: 60,
}

export function useHoverPreview(opts: HoverPreviewOptions = {}) {
  const { width, height, gap, enterDelay, leaveDelay } = {
    ...DEFAULTS,
    ...opts,
  }

  const [preview, setPreview] = useState<PreviewState>({
    open: false,
    url: '',
    name: '',
    top: 0,
    left: 0,
  })
  const enterRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const computePositionFromRect = useCallback(
    (rect: DOMRect) => {
      const midY = rect.top + rect.height / 2 + window.scrollY
      const vw = window.innerWidth || document.documentElement.clientWidth || 0
      const preferRight = rect.right + gap + width <= vw
      let left =
        (preferRight ? rect.right + gap : rect.left - gap - width) +
        window.scrollX

      // clamp horizontal si besoin
      left = Math.max(
        8 + window.scrollX,
        Math.min(left, vw - width - 8 + window.scrollX)
      )
      return { top: midY, left }
    },
    [gap, width]
  )

  const openAtRect = useCallback(
    ({ url, name = '', rect }: { url: string; name?: string; rect: DOMRect }) => {
      if (!url || !rect) return
      if (leaveRef.current) clearTimeout(leaveRef.current)
      const { top, left } = computePositionFromRect(rect)
      enterRef.current = setTimeout(() => {
        setPreview({ open: true, url, name, top, left })
      }, enterDelay)
    },
    [computePositionFromRect, enterDelay]
  )

  const close = useCallback(() => {
    if (enterRef.current) clearTimeout(enterRef.current)
    leaveRef.current = setTimeout(
      () => setPreview(p => ({ ...p, open: false })),
      leaveDelay
    )
  }, [leaveDelay])

  // Fournit des handlers prêts à poser sur une <tr>
  const getRowHoverHandlers = useCallback(
    ({ url, name }: { url: string; name: string }) => ({
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        if (!url) return
        const rect = e.currentTarget.getBoundingClientRect()
        openAtRect({ url, name, rect })
      },
      onMouseLeave: () => close(),
    }),
    [openAtRect, close]
  )

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && setPreview(p => ({ ...p, open: false }))
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (enterRef.current) clearTimeout(enterRef.current)
      if (leaveRef.current) clearTimeout(leaveRef.current)
    }
  }, [])

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
  )
}

import { useEffect } from 'react'

interface UseModalKeyboardNavigationProps {
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  isOpen: boolean
}

export default function useModalKeyboardNavigation({
  onClose,
  onNext,
  onPrev,
  isOpen,
}: UseModalKeyboardNavigationProps): void {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrev()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, onNext, onPrev, isOpen])
}

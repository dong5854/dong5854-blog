import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { mappedScroll, measureScrollAnchors, type ScrollAnchor } from '@/lib/editorScrollSync'

export function useScrollSync(
  textarea: RefObject<HTMLTextAreaElement | null>,
  preview: RefObject<HTMLElement | null>,
  enabled: boolean,
  body: string | undefined,
  code: string
) {
  const scrollDriver = useRef<'editor' | 'preview'>('editor')
  const cache = useRef<ScrollAnchor[] | null>(null)
  const syncFrom = useCallback(
    (source: 'editor' | 'preview') => {
      if (!enabled || !window.matchMedia('(min-width: 768px)').matches) return
      const field = textarea.current
      const pane = preview.current
      if (!field || !pane) return
      cache.current ??= measureScrollAnchors(field, pane)
      const from = source === 'editor' ? field : pane
      const to = source === 'editor' ? pane : field
      to.scrollTop = mappedScroll(cache.current, from.scrollTop, source)
    },
    [enabled, textarea, preview]
  )

  useEffect(() => {
    const field = textarea.current
    const pane = preview.current
    if (!field || !pane || !enabled) return
    let frame = 0
    const invalidate = () => {
      cache.current = null
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => syncFrom(scrollDriver.current))
    }
    const observer = new ResizeObserver(invalidate)
    observer.observe(field)
    observer.observe(pane)
    const content = pane.querySelector('.prose')
    if (content) observer.observe(content)
    pane.addEventListener('load', invalidate, true)
    invalidate()
    return () => {
      observer.disconnect()
      pane.removeEventListener('load', invalidate, true)
      cancelAnimationFrame(frame)
      cache.current = null
    }
  }, [textarea, preview, enabled, body, code, syncFrom])

  return { scrollDriver, syncFrom }
}

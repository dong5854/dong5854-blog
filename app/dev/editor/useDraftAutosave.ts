'use client'

import { useEffect, useRef, useState } from 'react'
import { writeDraft, readDraft, removeDraft, type EditorPost } from '@/lib/editorDrafts'

export function useDraftAutosave(post: EditorPost | null, saved: string) {
  const [result, setResult] = useState({ snapshot: '', error: false })
  const owned = useRef<EditorPost | null>(null)
  const pending = useRef<EditorPost | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  function flush() {
    clearTimeout(timer.current)
    if (!pending.current) return true
    try {
      writeDraft(localStorage, pending.current)
      owned.current = pending.current
      setResult({ snapshot: JSON.stringify(pending.current), error: false })
      pending.current = null
      return true
    } catch {
      setResult({ snapshot: '', error: true })
      return false
    }
  }
  useEffect(() => {
    pending.current = post && JSON.stringify(post) !== saved ? post : null
    if (pending.current) {
      timer.current = setTimeout(flush, 400)
    } else if (post && owned.current?.file === post.file) {
      // Undoing back to the saved version must not leave an obsolete recovery draft.
      try {
        const cached = readDraft(localStorage, post.file)
        if (JSON.stringify(cached?.post) === JSON.stringify(owned.current))
          removeDraft(localStorage, post.file)
        owned.current = null
      } catch {
        /* Keep the existing draft if storage is unavailable. */
      }
    }
    return () => clearTimeout(timer.current)
  }, [post, saved])
  useEffect(() => {
    const persist = () => flush()
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', persist)
    window.addEventListener('beforeunload', persist)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      persist()
      window.removeEventListener('pagehide', persist)
      window.removeEventListener('beforeunload', persist)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [])
  const snapshot = post ? JSON.stringify(post) : ''
  const status =
    !post || snapshot === saved
      ? ''
      : result.error
        ? '임시저장 실패 · 파일 저장을 이용해 주세요'
        : result.snapshot === snapshot
          ? '브라우저에 임시저장됨'
          : '임시저장 중…'
  function release() {
    clearTimeout(timer.current)
    pending.current = null
    owned.current = null
  }
  return { status, flush, release }
}

'use client'

import { useMemo, useRef, useState, type RefObject } from 'react'
import { findMatches } from '@/lib/editorSearch'
import { revealSelection } from '@/lib/editorSelection'

export default function SearchReplace({
  body,
  textarea,
  onClose,
}: {
  body: string
  textarea: RefObject<HTMLTextAreaElement | null>
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const matches = useMemo(() => findMatches(body, query), [body, query])
  const last = useRef(-1)
  const [active, setActive] = useState(-1)
  const inputClass =
    'min-w-0 flex-1 rounded-lg border-gray-300 bg-transparent text-sm dark:border-gray-700'
  const buttonClass =
    'rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800'
  function find(backwards = false) {
    const field = textarea.current
    if (!field || !matches.length) return
    const cursor = last.current >= 0 ? last.current + (backwards ? -1 : 1) : field.selectionStart
    const index = backwards
      ? matches.findLastIndex((position) => position <= cursor)
      : matches.findIndex((position) => position >= cursor)
    const wrapped = index < 0 ? (backwards ? matches.length - 1 : 0) : index
    last.current = matches[wrapped]
    setActive(wrapped)
    revealSelection(field, matches[wrapped], matches[wrapped] + query.length)
  }
  function replace(all = false) {
    const field = textarea.current
    if (!field || !matches.length) return
    field.focus()
    if (all) field.select()
    else if (field.value.slice(field.selectionStart, field.selectionEnd) !== query) {
      find()
      return
    }
    document.execCommand(
      'insertText',
      false,
      all ? body.split(query).join(replacement) : replacement
    )
    last.current = -1
    setActive(-1)
  }
  return (
    <div
      className="mb-4 space-y-2 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
      role="search"
      aria-label="본문 검색·바꾸기"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          textarea.current?.focus()
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          aria-label="찾을 내용"
          placeholder="찾을 내용 (대소문자 구분)"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            last.current = -1
            setActive(-1)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              find(event.shiftKey)
            }
          }}
          className={inputClass}
        />
        <span aria-live="polite" className="text-xs text-gray-500">
          {active >= 0 && active < matches.length ? `${active + 1} / ` : ''}
          {matches.length}개
        </span>
        <button
          type="button"
          onClick={() => find(true)}
          disabled={!matches.length}
          className={buttonClass}
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => find()}
          disabled={!matches.length}
          className={buttonClass}
        >
          다음
        </button>
        <button type="button" onClick={onClose} aria-label="검색 닫기" className={buttonClass}>
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="바꿀 내용"
          placeholder="바꿀 내용"
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => replace()}
          disabled={!matches.length}
          className={buttonClass}
        >
          바꾸기
        </button>
        <button
          type="button"
          onClick={() => replace(true)}
          disabled={!matches.length}
          className={buttonClass}
        >
          모두 바꾸기
        </button>
      </div>
    </div>
  )
}

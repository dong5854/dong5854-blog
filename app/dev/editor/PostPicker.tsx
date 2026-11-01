'use client'

import { useEffect, useRef, useState, useId } from 'react'

type Props = {
  folders?: boolean
  files: string[]
  selected?: string
  disabled: boolean
  onSelect: (file: string) => void
}

export default function PostPicker({
  files,
  selected,
  disabled,
  onSelect,
  folders = false,
}: Props) {
  const id = useId()
  const label = folders ? '폴더' : '글'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [placement, setPlacement] = useState({ above: false, height: 360 })
  const root = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])
  const matches = files.filter((file) =>
    file.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  )
  return (
    <div
      ref={root}
      className="relative min-w-0 flex-1 basis-64"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={folders ? '저장 폴더 선택' : '편집할 글 선택'}
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => {
          const rect = trigger.current?.getBoundingClientRect()
          if (rect) {
            const below = window.innerHeight - rect.bottom - 80
            const above = rect.top - 64
            const upward = below < 240 && above > below
            setPlacement({
              above: upward,
              height: Math.max(160, Math.min(420, upward ? above : below)),
            })
          }
          setOpen(!open)
          setQuery('')
        }}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left transition hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-600"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {folders
            ? selected || 'data/blog · 기본 폴더'
            : (selected?.replace(/\.mdx$/, '') ?? '편집할 글을 선택하세요')}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && !disabled && (
        <div
          id={id}
          role="dialog"
          aria-label={`${label} 선택`}
          style={{ maxHeight: placement.height }}
          className={`absolute left-0 right-0 z-20 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 ${placement.above ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          <div className="shrink-0 border-b border-gray-100 p-3 dark:border-gray-800">
            <input
              ref={search}
              type="search"
              aria-label={`${label} 검색`}
              placeholder={folders ? '폴더 이름으로 검색' : '파일 이름이나 폴더로 검색'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="min-h-0 overflow-y-auto p-2">
            {matches.map((file) => (
              <button
                type="button"
                key={file}
                onClick={() => {
                  setOpen(false)
                  trigger.current?.focus()
                  onSelect(file)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${selected === file ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {folders
                      ? file || '기본 폴더'
                      : file
                          .split('/')
                          .pop()
                          ?.replace(/\.mdx$/, '')}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-400">
                    {folders
                      ? `data/blog/${file}`
                      : `${file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : 'blog'} · MDX`}
                  </span>
                </span>
                {selected === file && (
                  <span aria-label={`현재 선택한 ${label}`} className="text-emerald-500">
                    ✓
                  </span>
                )}
              </button>
            ))}
            {!matches.length && (
              <p className="px-3 py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-800">
            {matches.length}개의 {label} · Esc로 닫기
          </div>
        </div>
      )}
    </div>
  )
}

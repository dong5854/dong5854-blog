'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { EditorPost } from '@/lib/editorDrafts'
import { diffLines } from '@/lib/editorDiff'

export default function ChangesDialog({
  before,
  after,
  onClose,
}: {
  before: EditorPost
  after: EditorPost
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lines = useMemo(() => diffLines(before.body, after.body), [before.body, after.body])
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  const metadata = [
    ['제목', before.title, after.title],
    ['태그', before.tags.join(', '), after.tags.join(', ')],
    ['초안', before.draft ? '예' : '아니요', after.draft ? '예' : '아니요'],
  ]
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="changes-title"
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
    >
      <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-950">
        <div>
          <h2 id="changes-title" className="font-bold">
            저장 전 변경 비교
          </h2>
          <p className="text-xs text-gray-500">
            마지막으로 불러오거나 저장한 파일 기준 · 실제 파일은 아직 변경되지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm"
        >
          닫기
        </button>
      </div>
      <div className="space-y-5 p-6">
        {metadata
          .filter(([, old, next]) => old !== next)
          .map(([label, old, next]) => (
            <div key={label} className="text-sm">
              <h3 className="mb-1 font-semibold">{label}</h3>
              <p className="break-words text-red-600 dark:text-red-400">− {old || '(없음)'}</p>
              <p className="break-words text-emerald-700 dark:text-emerald-400">
                + {next || '(없음)'}
              </p>
            </div>
          ))}
        <h3 className="text-sm font-semibold">본문 · + 추가 / − 삭제</h3>
        {before.body === after.body ? (
          <p className="text-sm text-gray-500">본문 변경이 없습니다.</p>
        ) : (
          <pre className="overflow-x-auto rounded-lg border border-gray-200 text-xs leading-6 dark:border-gray-800">
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.kind === 'added'
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : line.kind === 'removed'
                      ? 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
                      : 'text-gray-500'
                }
              >
                {line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '− ' : '  '}
                {line.text || ' '}
              </div>
            ))}
          </pre>
        )}
      </div>
    </dialog>
  )
}

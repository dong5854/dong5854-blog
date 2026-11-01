'use client'

import { useState } from 'react'
import PostPicker from './PostPicker'

type NewPost = { file: string; title: string; date: string }
export default function NewPostForm({
  busy,
  folders,
  onCreate,
  onCancel,
}: {
  folders: string[]
  busy: boolean
  onCreate: (post: NewPost) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState('')
  const [folder, setFolder] = useState('')
  const [customFolder, setCustomFolder] = useState(false)
  const filename = file.trim().endsWith('.mdx') ? file.trim() : `${file.trim()}.mdx`
  const filepath = [folder.trim(), filename].filter(Boolean).join('/')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  })
  const inputClass =
    'mt-2 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-gray-50/50 px-6 py-10 dark:bg-gray-900/30 md:py-16">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onCreate({ title: title.trim(), file: filepath, date })
        }}
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:p-10"
      >
        <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-600">NEW POST</p>
        <h1 className="text-3xl font-bold">새 글 작성</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          새 MDX 파일을 초안으로 만들고, 바로 글을 써 보세요.
        </p>
        <fieldset disabled={busy} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            제목
            <input
              required
              aria-label="새 글 제목"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="어떤 이야기를 남길까요?"
              className={inputClass}
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">저장 폴더</span>
              <button
                type="button"
                onClick={() => {
                  setCustomFolder(!customFolder)
                  setFolder('')
                }}
                className="text-xs font-medium text-emerald-600"
              >
                {customFolder ? '기존 폴더 선택' : '+ 새 폴더'}
              </button>
            </div>
            {customFolder ? (
              <input
                required
                aria-label="새 폴더 이름"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="notes 또는 notes/python"
                className={inputClass}
              />
            ) : (
              <PostPicker
                folders
                files={folders}
                selected={folder}
                disabled={busy}
                onSelect={setFolder}
              />
            )}
          </div>
          <label className="block text-sm font-medium">
            파일 이름
            <input
              required
              aria-label="새 글 파일 이름"
              value={file}
              onChange={(event) => {
                const value = event.target.value
                event.target.setCustomValidity(
                  /[\\/]/.test(value)
                    ? '폴더는 위에서 선택하고, 여기는 파일 이름만 입력하세요.'
                    : ''
                )
                setFile(value)
              }}
              placeholder="my-new-post"
              className={`${inputClass} font-mono text-sm`}
            />
            <span className="mt-2 block text-xs font-normal leading-5 text-gray-400">
              문자·숫자·하이픈·밑줄을 사용하세요. .mdx 확장자는 자동으로 붙습니다.
            </span>
          </label>
          <p
            className="break-all rounded-lg bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            aria-label="저장 예정 경로"
          >
            data/blog/{file.trim() ? filepath : `${folder ? folder + '/' : ''}파일-이름.mdx`}
          </p>
          <label className="block text-sm font-medium">
            작성일
            <input
              required
              aria-label="새 글 작성일"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-5 py-3 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {busy ? '만드는 중…' : '초안 만들기'}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}

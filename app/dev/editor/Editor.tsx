'use client'

import {
  Component,
  memo,
  startTransition,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createLocalPreview } from './localPreview'
import PostPicker from './PostPicker'
import NewPostForm from './NewPostForm'
import SearchReplace from './SearchReplace'
import ImageSettings from './ImageSettings'
import ChangesDialog from './ChangesDialog'
import { editorTemplates } from '@/lib/editorTemplates'
import {
  continueList,
  indentLines,
  applyTextEdit,
  lineBoundarySelection,
} from '@/lib/editorFormatting'
import { bindEditorSaveShortcut } from '@/lib/editorSaveShortcut'
import { useDraftAutosave } from './useDraftAutosave'
import {
  draftFiles,
  readDraft,
  removeDraft,
  type EditorPost,
  type EditorDraft,
} from '@/lib/editorDrafts'
import { useScrollSync } from './useScrollSync'
import { MDXLayoutRenderer } from '@/components/MDXRenderer'

const PreviewContent = memo(MDXLayoutRenderer)

const endpoint = '/api/dev/editor'
type Post = EditorPost
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '요청에 실패했습니다.')
  return data
}
const send = (data: unknown) =>
  request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

class PreviewBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    return this.state.error ? (
      <p role="alert" className="text-red-600">
        미리보기 오류: {this.state.error}
      </p>
    ) : (
      this.props.children
    )
  }
}

export default function Editor() {
  const [files, setFiles] = useState<string[]>([])
  const [folders, setFolders] = useState<string[]>([''])
  const [post, setPost] = useState<Post | null>(null)
  const [saved, setSaved] = useState('')
  const [code, setCode] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [message, setMessage] = useState('글을 선택해 편집을 시작하세요.')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const dirty = !!post && JSON.stringify(post) !== saved
  const autosave = useDraftAutosave(post, saved)
  const [recovery, setRecovery] = useState<EditorDraft | null>(null)
  const [recoverableFiles, setRecoverableFiles] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [imagesOpen, setImagesOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [syncScroll, setSyncScroll] = useState(true)
  const preview = useRef<HTMLElement>(null)
  const { scrollDriver, syncFrom } = useScrollSync(textarea, preview, syncScroll, post?.body, code)

  useEffect(() => {
    request(endpoint)
      .then((data) => {
        setFiles(data.files)
        setFolders(data.folders)
        try {
          setRecoverableFiles(draftFiles(localStorage).filter((file) => data.files.includes(file)))
        } catch {
          setMessage('브라우저 임시저장소를 사용할 수 없습니다. 파일 저장을 이용해 주세요.')
        }
      })
      .catch((error) => setMessage(error.message))
  }, [])
  useEffect(() => {
    if (!dirty && !busy && !uploading && !creating) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy, uploading, creating])
  const previewBody = post?.body
  const previewFile = post?.file
  const previewQueue = useRef<ReturnType<typeof createLocalPreview> | null>(null)
  useEffect(() => {
    if (!previewFile) return
    const queue = createLocalPreview(
      (nextCode) =>
        startTransition(() => {
          setCode(nextCode)
          setPreviewError('')
        }),
      (error) => setPreviewError((error as Error).message)
    )
    previewQueue.current = queue
    return () => {
      queue.dispose()
      previewQueue.current = null
    }
  }, [previewFile])
  useEffect(() => {
    if (previewBody !== undefined) previewQueue.current?.submit(previewBody)
  }, [previewBody, previewFile])

  async function open(file: string) {
    if (busy || uploading) return
    if (!file || (dirty && !window.confirm('현재 변경은 브라우저에 임시저장하고 글을 불러올까요?')))
      return
    if (!autosave.flush()) return
    setBusy(true)
    try {
      const data = await request(`${endpoint}?file=${encodeURIComponent(file)}`)
      const next: Post = {
        file: data.file,
        revision: data.revision,
        title: data.title,
        tags: data.tags,
        draft: data.draft,
        body: data.body,
      }
      autosave.release()
      setCreating(false)
      setPost(next)
      setSaved(JSON.stringify(next))
      setCode('')
      setPreviewError('')
      setSearchOpen(false)
      setImagesOpen(false)
      setChangesOpen(false)
      try {
        const cached = readDraft(localStorage, file)
        setRecovery(cached && JSON.stringify(cached.post) !== JSON.stringify(next) ? cached : null)
      } catch {
        setRecovery(null)
      }
      setMessage('글을 불러왔습니다.')
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function create(input: { title: string; file: string; date: string }) {
    if (busy) return
    setBusy(true)
    try {
      const data = await send({ action: 'create', ...input, tags: [], body: '\n' })
      const next: Post = {
        file: data.file,
        revision: data.revision,
        title: data.title,
        tags: data.tags,
        body: data.body,
        draft: data.draft,
      }
      setPost(next)
      setSaved(JSON.stringify(next))
      setFiles((current) => [...current, next.file].sort())
      const folder = next.file.includes('/') ? next.file.slice(0, next.file.lastIndexOf('/')) : ''
      setFolders((current) =>
        Array.from(
          new Set([
            ...current,
            ...folder.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/')),
          ])
        ).sort()
      )
      setCreating(false)
      setCode('')
      setPreviewError('')
      setRecovery(null)
      setSearchOpen(false)
      setImagesOpen(false)
      setChangesOpen(false)
      setMessage('새 초안을 만들었습니다. 내용을 작성한 뒤 파일을 저장하세요.')
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  // Capture at the window so saving works even when focus is outside the editor fields.
  useEffect(() =>
    bindEditorSaveShortcut(window, () => {
      void save()
    })
  )

  async function save() {
    if (!post || busy || uploading || creating || recovery || !dirty) return
    const snapshot = { ...post, tags: post.tags.map((tag) => tag.trim()).filter(Boolean) }
    setSaving(true)
    setBusy(true)
    try {
      const result = await send({ action: 'save', ...snapshot })
      setPost(
        (current) =>
          current && {
            ...current,
            tags: current.tags === post.tags ? snapshot.tags : current.tags,
            revision: result.revision,
          }
      )
      setSaved(JSON.stringify({ ...snapshot, revision: result.revision }))
      try {
        removeDraft(localStorage, snapshot.file)
      } catch {
        /* Keep file save successful. */
      }
      setRecovery(null)
      setRecoverableFiles((current) => current.filter((file) => file !== snapshot.file))
      setMessage('로컬 MDX 파일에 저장했습니다.')
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setSaving(false)
      setBusy(false)
    }
  }
  function insert(before: string, after = '', placeholder = '') {
    const field = textarea.current
    if (!field) return
    let start = field.selectionStart
    let end = field.selectionEnd
    let selected = field.value.slice(start, end) || placeholder
    if (/^(#{1,4}|>) $/.test(before)) {
      start = field.value.lastIndexOf('\n', start - 1) + 1
      const lineEnd = field.value.indexOf('\n', end)
      end = lineEnd === -1 ? field.value.length : lineEnd
      selected = (field.value.slice(start, end) || placeholder)
        .split('\n')
        .map((line) => before + (before.startsWith('#') ? line.replace(/^#{1,6}\s+/, '') : line))
        .join('\n')
      before = ''
    }
    if (applyTextEdit(field, { start, end, text: before + selected + after })) {
      field.setSelectionRange(start + before.length, start + before.length + selected.length)
    }
  }

  async function upload(file: File) {
    if (!post || busy || uploading || creating) return
    if (file.size > 10 * 1024 * 1024) {
      setMessage('10MB 이하 이미지를 선택해 주세요.')
      return
    }
    const original = post
    const start = textarea.current?.selectionStart ?? post.body.length
    const end = textarea.current?.selectionEnd ?? start
    setUploading(true)
    setMessage('이미지를 저장하는 중입니다…')
    try {
      const form = new FormData()
      form.set('image', file)
      const result = await request(endpoint, { method: 'POST', body: form })
      const markdown = `\n![이미지 설명](${result.url})\n`
      const field = textarea.current
      if (!field) return
      field.focus()
      // Preserve the browser's undo/redo history instead of replacing the React value.
      // If typing continued during upload, append rather than replace a stale selection.
      field.setSelectionRange(
        field.value === original.body ? start : field.value.length,
        field.value === original.body ? end : field.value.length
      )
      if (!document.execCommand('insertText', false, markdown))
        throw new Error('이미지를 삽입하지 못했습니다. 다른 브라우저에서 다시 시도해 주세요.')
      setMessage('이미지를 넣었습니다. 이미지 설명을 수정한 뒤 글을 저장하세요.')
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setUploading(false)
      if (imageInput.current) imageInput.current.value = ''
    }
  }
  function leave() {
    if (!autosave.flush()) return
    if ((!dirty && !creating) || window.confirm('저장하지 않은 변경 내용을 버리고 나갈까요?'))
      window.location.href = '/blog'
  }
  const tools = [
    ['H1', '# ', '', '제목'],
    ['H2', '## ', '', '제목'],
    ['H3', '### ', '', '제목'],
    ['H4', '#### ', '', '제목'],
    ['굵게', '**', '**', '텍스트'],
    ['기울임', '*', '*', '텍스트'],
    ['취소선', '~~', '~~', '텍스트'],
    ['인용', '> ', '', '인용문'],
    ['링크', '[', '](https://)', '링크 설명'],
    ['코드', '\n```js\n', '\n```\n', '코드'],
  ]
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 'f' &&
          post &&
          !creating
        ) {
          event.preventDefault()
          setSearchOpen(true)
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-6 py-3 dark:border-gray-800">
        <span className="text-xs font-bold tracking-widest text-emerald-600">LOCAL · MDX</span>
        {creating ? (
          <span className="text-sm text-gray-500">새 글 작성</span>
        ) : (
          <>
            <PostPicker
              files={files}
              selected={post?.file}
              disabled={busy || uploading || creating}
              onSelect={(file) => void open(file)}
            />
            <button
              type="button"
              disabled={busy || uploading || creating}
              onClick={() => {
                if (dirty && !window.confirm('저장하지 않은 변경 내용을 두고 새 글을 작성할까요?'))
                  return
                if (!autosave.flush()) return
                setCreating(true)
                setMessage('제목과 파일 경로를 입력하세요.')
              }}
              className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
            >
              + 새 글
            </button>
            <button
              type="button"
              disabled={!post || busy || uploading || creating}
              onClick={() => post && void open(post.file)}
              className="shrink-0 whitespace-nowrap text-sm text-emerald-600 disabled:opacity-40"
            >
              다시 불러오기
            </button>
            <span className="inline-grid shrink-0 whitespace-nowrap text-right text-xs text-gray-500">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                저장하지 않은 변경
              </span>
              <span aria-live="polite" className="col-start-1 row-start-1">
                {dirty ? '저장하지 않은 변경' : '저장됨'}
              </span>
            </span>
          </>
        )}
      </div>
      {recovery && !creating && post && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="min-w-0 flex-1">
            {new Date(recovery.updatedAt).toLocaleString()} 임시저장본이 있습니다.
            {recovery.post.revision !== post.revision &&
              ' 원본 파일도 변경되어 복구 후 저장 시 충돌 확인이 필요합니다.'}
          </p>
          <button
            type="button"
            disabled={busy || uploading}
            className="rounded border px-3 py-1"
            onClick={() => {
              setPost(recovery.post)
              setRecovery(null)
              setMessage('임시저장본을 복구했습니다. 확인 후 파일을 저장하세요.')
            }}
          >
            임시저장 복구
          </button>
          <button
            type="button"
            className="rounded border px-3 py-1"
            onClick={() => {
              try {
                removeDraft(localStorage, post.file)
                setRecovery(null)
              } catch {
                setMessage('임시저장본을 삭제하지 못했습니다.')
              }
            }}
          >
            임시저장 삭제
          </button>
        </div>
      )}
      {creating ? (
        <NewPostForm
          folders={folders}
          busy={busy}
          onCreate={(input) => void create(input)}
          onCancel={() => {
            setCreating(false)
            setMessage('새 글 작성을 취소했습니다.')
          }}
        />
      ) : !post ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6 text-gray-500">
          <p>글을 선택하거나 + 새 글로 작성을 시작하세요.</p>
          {recoverableFiles.length > 0 && (
            <div className="w-full max-w-xl space-y-2">
              <p className="text-sm font-semibold">복구할 수 있는 임시저장 글</p>
              {recoverableFiles.map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => void open(file)}
                  className="block w-full truncate rounded-lg border border-gray-200 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {file}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto md:grid-cols-2 md:overflow-hidden">
          <fieldset
            disabled={(busy && !saving) || !!recovery}
            aria-label="MDX 편집"
            className="flex min-h-[65vh] min-w-0 flex-col overflow-auto border-r border-gray-100 p-6 dark:border-gray-800 md:p-10"
          >
            <input
              aria-label="글 제목"
              value={post.title}
              onChange={(event) => setPost({ ...post, title: event.target.value })}
              placeholder="제목을 입력하세요"
              className="w-full border-0 bg-transparent p-0 text-4xl font-extrabold focus:ring-0"
            />
            <label className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={post.draft}
                onChange={(event) => setPost({ ...post, draft: event.target.checked })}
                className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800"
              />
              초안 (배포 시 숨김)
            </label>
            <div className="my-6 h-1 w-16 shrink-0 bg-gray-700" />
            <input
              aria-label="태그 (쉼표로 구분)"
              value={post.tags.join(',')}
              onChange={(event) => setPost({ ...post, tags: event.target.value.split(',') })}
              placeholder="태그를 쉼표로 구분해 입력하세요"
              className="border-0 bg-transparent p-0 text-sm focus:ring-0"
            />
            <div
              role="toolbar"
              aria-label="본문 서식"
              className="my-6 flex flex-wrap gap-1 border-y border-gray-100 py-2 dark:border-gray-800"
            >
              {tools.map(([label, before, after, placeholder]) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insert(before, after, placeholder)}
                  className="rounded px-2 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {label}
                </button>
              ))}
              {editorTemplates.map(([label, markup]) => (
                <button
                  key={label}
                  type="button"
                  title={`${label} MDX 삽입`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const field = textarea.current
                    if (!field) return
                    applyTextEdit(field, {
                      start: field.selectionStart,
                      end: field.selectionEnd,
                      text: `\n\n${markup}\n\n`,
                    })
                  }}
                  className="rounded px-2 py-2 text-sm font-semibold text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                disabled={uploading}
                onClick={() => imageInput.current?.click()}
                className="rounded px-2 py-2 text-sm font-semibold text-emerald-600"
              >
                이미지
              </button>
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setSearchOpen((value) => !value)}
                className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700"
              >
                검색·바꾸기 ⌘/Ctrl F
              </button>
              <button
                type="button"
                onClick={() => setImagesOpen((value) => !value)}
                className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700"
              >
                이미지 편집
              </button>
              <label className="hidden items-center gap-2 md:flex">
                <input
                  type="checkbox"
                  checked={syncScroll}
                  onChange={(event) => setSyncScroll(event.target.checked)}
                  className="rounded text-emerald-500"
                />
                스크롤 연동
              </label>
            </div>
            {searchOpen && (
              <SearchReplace
                key={post.file}
                body={post.body}
                textarea={textarea}
                onClose={() => setSearchOpen(false)}
              />
            )}
            {imagesOpen && (
              <ImageSettings
                key={post.file}
                body={post.body}
                textarea={textarea}
                onClose={() => setImagesOpen(false)}
              />
            )}
            <input
              ref={imageInput}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              aria-label="이미지 업로드"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
              }}
            />
            <textarea
              ref={textarea}
              aria-label="MDX 본문"
              spellCheck={false}
              onFocus={() => {
                scrollDriver.current = 'editor'
              }}
              onWheel={() => {
                scrollDriver.current = 'editor'
              }}
              onPointerDown={() => {
                scrollDriver.current = 'editor'
              }}
              onKeyDown={(event) => {
                scrollDriver.current = 'editor'
                if (event.nativeEvent.isComposing) return
                if (
                  (event.key === 'Home' || event.key === 'End') &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey
                ) {
                  event.preventDefault()
                  event.stopPropagation()
                  const field = event.currentTarget
                  field.setSelectionRange(
                    ...lineBoundarySelection(
                      field.value,
                      field.selectionStart,
                      field.selectionEnd,
                      field.selectionDirection,
                      event.key,
                      event.shiftKey
                    )
                  )
                  return
                }
                if (event.key === 'Escape') {
                  event.currentTarget.blur()
                  return
                }
                if ((event.metaKey || event.ctrlKey) && !event.altKey) {
                  const key = event.key.toLowerCase()
                  if (['b', 'i', 'k'].includes(key)) {
                    event.preventDefault()
                    if (key === 'b') insert('**', '**', '텍스트')
                    else if (key === 'i') insert('*', '*', '텍스트')
                    else insert('[', '](https://)', '링크 설명')
                  }
                } else if (event.key === 'Enter' && !event.shiftKey) {
                  const edit = continueList(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart,
                    event.currentTarget.selectionEnd
                  )
                  if (edit) {
                    event.preventDefault()
                    applyTextEdit(event.currentTarget, edit)
                  }
                } else if (event.key === 'Tab' && !event.altKey) {
                  event.preventDefault()
                  const edit = indentLines(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart,
                    event.currentTarget.selectionEnd,
                    event.shiftKey
                  )
                  const selected =
                    event.currentTarget.selectionStart !== event.currentTarget.selectionEnd
                  applyTextEdit(event.currentTarget, edit)
                  if (selected)
                    event.currentTarget.setSelectionRange(edit.start, edit.start + edit.text.length)
                }
              }}
              onScroll={() => {
                if (scrollDriver.current === 'editor') syncFrom('editor')
              }}
              value={post.body}
              onChange={(event) => setPost({ ...post, body: event.target.value })}
              onPaste={(event) => {
                const file = Array.from(event.clipboardData.files).find((file) =>
                  file.type.startsWith('image/')
                )
                if (file) {
                  event.preventDefault()
                  void upload(file)
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const file = event.dataTransfer.files[0]
                if (file) void upload(file)
              }}
              className="min-h-80 w-full flex-1 resize-none border-0 bg-transparent p-0 font-mono text-base leading-8 focus:ring-0"
            />
            <p className="mt-3 text-xs text-gray-400">
              ⌘/Ctrl B 굵게 · I 기울임 · K 링크 · Tab 들여쓰기 · Esc 편집창 나가기
              <br />
              이미지 붙여넣기 ⌘/Ctrl V · 파일 드래그 · 저장 ⌘/Ctrl S
            </p>
          </fieldset>
          <section
            ref={preview}
            tabIndex={0}
            onWheel={() => {
              scrollDriver.current = 'preview'
            }}
            onPointerDown={() => {
              scrollDriver.current = 'preview'
            }}
            onKeyDown={() => {
              scrollDriver.current = 'preview'
            }}
            onScroll={() => {
              if (scrollDriver.current === 'preview') syncFrom('preview')
            }}
            aria-label="실시간 미리보기"
            onClickCapture={(event) => {
              const target = event.target
              const link = target instanceof Element ? target.closest('a') : null
              if (link && !link.getAttribute('href')?.startsWith('#')) {
                event.preventDefault()
                event.stopPropagation()
                setMessage('편집 중에는 미리보기 링크로 이동하지 않습니다.')
              }
            }}
            className="overflow-auto bg-gray-50/70 p-6 dark:bg-gray-900/50 md:p-10"
          >
            <p className="mb-7 text-xs font-medium tracking-widest text-gray-400">미리보기</p>
            <h1 className="mb-6 break-words text-4xl font-extrabold">{post.title}</h1>
            <div className="mb-10 flex flex-wrap gap-2 text-sm text-emerald-600">
              {post.tags.filter(Boolean).map((tag, i) => (
                <span key={i}>#{tag.trim()}</span>
              ))}
            </div>
            {previewError && (
              <p
                role="alert"
                className="mb-4 whitespace-pre-wrap rounded bg-red-50 p-3 text-sm text-red-700"
              >
                MDX 문법을 확인해 주세요. 마지막 정상 미리보기를 표시합니다.{'\n'}
                {previewError}
              </p>
            )}
            {code && (
              <PreviewBoundary key={code}>
                <div className="prose max-w-none dark:prose-invert">
                  <PreviewContent code={code} />
                </div>
              </PreviewBoundary>
            )}
          </section>
        </div>
      )}
      {changesOpen && post && saved && (
        <ChangesDialog
          before={JSON.parse(saved)}
          after={post}
          onClose={() => setChangesOpen(false)}
        />
      )}
      <footer className="flex flex-wrap items-center gap-4 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
        {!creating && (
          <button type="button" disabled={busy || uploading} onClick={leave} className="px-2 py-2">
            ← 나가기
          </button>
        )}
        <p role="status" className="min-w-0 flex-1 text-sm text-gray-500">
          {message}
          {autosave.status && <span className="block text-xs">{autosave.status}</span>}
        </p>
        {!creating && (
          <button
            type="button"
            disabled={!post || busy || uploading || !!recovery}
            onClick={() => setChangesOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm disabled:opacity-40 dark:border-gray-700"
          >
            변경 비교
          </button>
        )}
        {!creating && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void save()}
            disabled={!post || busy || uploading || creating || !!recovery || !dirty}
            className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {busy ? '처리 중…' : '파일 저장'}
          </button>
        )}
      </footer>
    </div>
  )
}

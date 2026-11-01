export type EditorPost = {
  file: string
  revision: string
  title: string
  tags: string[]
  body: string
  draft: boolean
}
export type EditorDraft = { post: EditorPost; updatedAt: number }
const prefix = 'local-mdx-draft:v1:'
export function readDraft(storage: Storage, file: string): EditorDraft | null {
  const raw = storage.getItem(prefix + file)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as EditorDraft
    const p = value.post
    return p?.file === file &&
      typeof p.revision === 'string' &&
      typeof p.title === 'string' &&
      typeof p.body === 'string' &&
      typeof p.draft === 'boolean' &&
      Array.isArray(p.tags) &&
      p.tags.every((tag) => typeof tag === 'string') &&
      Number.isFinite(value.updatedAt)
      ? value
      : null
  } catch {
    return null
  }
}
export function writeDraft(storage: Storage, post: EditorPost) {
  storage.setItem(prefix + post.file, JSON.stringify({ post, updatedAt: Date.now() }))
}
export function removeDraft(storage: Storage, file: string) {
  storage.removeItem(prefix + file)
}
export function draftFiles(storage: Storage) {
  return Array.from({ length: storage.length }, (_, i) => storage.key(i))
    .filter((key): key is string => !!key?.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter((file) => readDraft(storage, file))
}

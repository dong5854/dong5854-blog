import { createHash, randomUUID } from 'node:crypto'
import { readdir, readFile, realpath, writeFile, rename, rm, stat, mkdir } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const root = path.join(process.cwd(), 'data/blog')
export const revision = (source: string) => createHash('sha256').update(source).digest('hex')

export async function postPath(file: string) {
  if (!file.endsWith('.mdx') || file.includes('..') || path.isAbsolute(file))
    throw new Error('잘못된 파일 경로입니다.')
  const resolved = await realpath(path.join(root, file))
  if (!resolved.startsWith((await realpath(root)) + path.sep))
    throw new Error('허용되지 않은 파일입니다.')
  return resolved
}

export async function listPosts(dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name)
      if (entry.isDirectory()) return listPosts(target)
      return entry.isFile() && entry.name.endsWith('.mdx') ? [path.relative(root, target)] : []
    })
  )
  return files.flat().sort()
}

export async function listFolders(dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => listFolders(path.join(dir, entry.name)))
  )
  return [path.relative(root, dir), ...nested.flat()].sort()
}

export async function readPost(file: string) {
  const source = await readFile(await postPath(file), 'utf8')
  const parsed = matter(source)
  return {
    file,
    source,
    revision: revision(source),
    title: parsed.data.title ?? '',
    tags: parsed.data.tags ?? [],
    draft: parsed.data.draft ?? false,
    body: parsed.content,
  }
}

// Serialize saves in this server process so two editor tabs cannot silently overwrite each other.
let saving = Promise.resolve()
export async function savePost(input: {
  file: string
  revision: string
  title: string
  tags: string[]
  body: string
  draft?: boolean
}) {
  const operation = saving.then(async () => {
    const target = await postPath(input.file)
    const source = await readFile(target, 'utf8')
    if (revision(source) !== input.revision)
      throw new Error(
        '파일이 외부에서 변경되었습니다. 수정 내용을 복사한 뒤 글을 다시 열어 주세요.'
      )
    const parsed = matter(source)
    const next =
      (input.draft === undefined || input.draft === (parsed.data.draft ?? false)) &&
      input.title === parsed.data.title &&
      JSON.stringify(input.tags) === JSON.stringify(parsed.data.tags ?? [])
        ? source.slice(0, source.length - parsed.content.length) + input.body
        : matter.stringify(input.body, {
            ...parsed.data,
            title: input.title,
            tags: input.tags,
            ...(input.draft === undefined ? {} : { draft: input.draft }),
          })
    const temporary = `${target}.${randomUUID()}.tmp`
    try {
      const { mode } = await stat(target)
      await writeFile(temporary, next, { encoding: 'utf8', flag: 'wx', mode })
      if (revision(await readFile(target, 'utf8')) !== input.revision)
        throw new Error('저장 중 파일이 변경되었습니다. 수정 내용을 복사한 뒤 다시 열어 주세요.')
      await rename(temporary, target)
    } finally {
      await rm(temporary, { force: true })
    }
    return { revision: revision(next) }
  })
  saving = operation.then(
    () => {},
    () => {}
  )
  return operation
}

export async function createPost(input: {
  file: string
  title: string
  tags: string[]
  body: string
  date: string
}) {
  if (
    !/^[\p{L}\p{N}_/-]+\.mdx$/u.test(input.file) ||
    input.file.startsWith('/') ||
    input.file.includes('//') ||
    input.file.endsWith('/.mdx')
  )
    throw new Error(
      '파일 경로는 폴더/글-이름.mdx 형식으로 입력하세요. 문자, 숫자, 하이픈, 밑줄을 사용할 수 있습니다.'
    )
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !Number.isFinite(Date.parse(input.date)) ||
    new Date(input.date).toISOString().slice(0, 10) !== input.date
  )
    throw new Error('올바른 작성일을 입력하세요.')
  const base = await realpath(root)
  const parts = input.file.split('/')
  const filename = parts.pop()!
  let directory = base
  for (const part of parts) {
    directory = path.join(directory, part)
    try {
      await mkdir(directory)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
    directory = await realpath(directory)
    if (!directory.startsWith(base + path.sep)) throw new Error('허용되지 않은 폴더입니다.')
  }
  const source = matter.stringify(input.body, {
    title: input.title,
    date: input.date,
    tags: input.tags,
    draft: true,
  })
  try {
    await writeFile(path.join(directory, filename), source, { encoding: 'utf8', flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error('같은 경로의 글이 이미 있습니다. 다른 파일 이름을 입력하세요.')
    throw error
  }
  return readPost(input.file)
}

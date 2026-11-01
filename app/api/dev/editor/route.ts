import { NextRequest, NextResponse } from 'next/server'
import { compile } from '@mdx-js/mdx'
import { mkdir, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { sync as probe } from 'probe-image-size'
import { localDevRequest } from '@/lib/dev/access'
import { listPosts, readPost, savePost, createPost, listFolders } from '@/lib/dev/files'
import { mdxOptions } from '@/lib/mdx-options'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

export async function GET(request: NextRequest) {
  if (!localDevRequest(request.headers)) return json({ error: 'Not found' }, 404)
  try {
    const file = request.nextUrl.searchParams.get('file')
    return json(
      file ? await readPost(file) : { files: await listPosts(), folders: await listFolders() }
    )
  } catch (error) {
    return json({ error: String(error) }, 400)
  }
}

export async function POST(request: NextRequest) {
  if (!localDevRequest(request.headers)) return json({ error: 'Not found' }, 404)
  if (Number(request.headers.get('content-length')) > 12 * 1024 * 1024)
    return json({ error: '파일이 너무 큽니다.' }, 413)
  try {
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('image')
      if (!(file instanceof File) || file.size > 10 * 1024 * 1024)
        throw new Error('10MB 이하 이미지를 선택해 주세요.')
      const buffer = Buffer.from(await file.arrayBuffer())
      const info = probe(buffer)
      if (!info || !['png', 'jpeg', 'gif', 'webp'].includes(info.type))
        throw new Error('PNG, JPEG, GIF, WebP 이미지만 지원합니다.')
      const publicRoot = await realpath(path.join(process.cwd(), 'public'))
      const directory = path.join(publicRoot, 'static/images/editor')
      await mkdir(directory, { recursive: true })
      if (!(await realpath(directory)).startsWith(publicRoot + path.sep))
        throw new Error('허용되지 않은 이미지 경로입니다.')
      const name = `${randomUUID()}.${info.type === 'jpeg' ? 'jpg' : info.type}`
      await writeFile(path.join(directory, name), buffer, { flag: 'wx' })
      return json({ url: `/static/images/editor/${name}` })
    }
    const input = await request.json()
    if (typeof input.body !== 'string' || input.body.length > 2_000_000)
      throw new Error('본문이 없거나 너무 큽니다.')
    if (
      !['save', 'create'].includes(input.action) ||
      typeof input.file !== 'string' ||
      (input.action === 'save' && typeof input.revision !== 'string') ||
      (input.draft !== undefined && typeof input.draft !== 'boolean') ||
      typeof input.title !== 'string' ||
      !input.title.trim() ||
      !Array.isArray(input.tags) ||
      !input.tags.every((tag: unknown) => typeof tag === 'string')
    )
      throw new Error('글 제목과 저장 정보를 확인해 주세요.')
    await compile(input.body, mdxOptions)
    if (input.action === 'create') {
      if (typeof input.date !== 'string') throw new Error('작성일이 필요합니다.')
      return json(await createPost(input), 201)
    }
    return json(await savePost(input))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
}

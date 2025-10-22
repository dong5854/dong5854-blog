import { readFileSync } from 'fs'
import path from 'path'
import type { Blog, Authors } from 'contentlayer/generated'

function readGeneratedJson<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), '.contentlayer', 'generated', relativePath)
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

export const allBlogs = readGeneratedJson<Blog[]>('Blog/_index.json')
export const allAuthors = readGeneratedJson<Authors[]>('Authors/_index.json')

export type { Blog, Authors }

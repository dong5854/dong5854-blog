import { readFileSync } from 'fs'
import path from 'path'

type Blog = {
  title: string
  date: string
  tags: string[]
  draft: boolean
  summary?: string
  images?: string | string[]
  authors?: string[]
  layout?: string
  bibliography?: string
  canonicalUrl?: string
  body: string
  raw: string
  toc: Array<{ title: string; url: string; depth: number }>
  slug: string
  path: string
  filePath: string
  readingTime: { readingTime: number; wordCount: number }
  lastmod?: string
  structuredData: {
    '@context': string
    '@type': string
    headline: string
    datePublished: string
    dateModified: string
    description?: string
    image: string
    url: string
  }
}

type Authors = {
  name: string
  avatar?: string
  occupation?: string
  company?: string
  email?: string
  twitter?: string
  linkedin?: string
  github?: string
  layout?: string
  body: string
  slug: string
  path: string
  filePath: string
}

function readVeliteJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), '.velite', filename)
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

const isDev = process.env.NODE_ENV === 'development'

function createDevProxy<T extends object>(filename: string): T {
  const handler: ProxyHandler<T> = {
    get(_, prop, receiver) {
      const data = readVeliteJson<T>(filename)
      return Reflect.get(data, prop, receiver)
    },
    has(_, prop) {
      const data = readVeliteJson<T>(filename)
      return Reflect.has(data, prop)
    },
    ownKeys() {
      const data = readVeliteJson<T>(filename)
      return Reflect.ownKeys(data)
    },
    getOwnPropertyDescriptor(_, prop) {
      const data = readVeliteJson<T>(filename)
      return Reflect.getOwnPropertyDescriptor(data, prop)
    },
  }
  return new Proxy([] as unknown as T, handler)
}

export const allBlogs: Blog[] = isDev
  ? createDevProxy<Blog[]>('blogs.json')
  : readVeliteJson<Blog[]>('blogs.json')

export const allAuthors: Authors[] = isDev
  ? createDevProxy<Authors[]>('authors.json')
  : readVeliteJson<Authors[]>('authors.json')

export type { Blog, Authors }

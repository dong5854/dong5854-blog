import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { localDevRequest } from '@/lib/dev/access'
import Editor from './Editor'
import 'css/prism.css'
import 'katex/dist/katex.min.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: '로컬 MDX 편집기', robots: { index: false, follow: false } }

export default async function EditorPage() {
  if (!localDevRequest(await headers())) notFound()
  return <Editor />
}

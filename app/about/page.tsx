import { allAuthors } from '@/lib/contentlayer'
import { MDXLayoutRenderer } from '@/components/MDXRenderer'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from '@/lib/content'
import { genPageMetadata } from 'app/seo'
import { notFound } from 'next/navigation'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default')
  if (!author) notFound()
  const mainContent = coreContent(author)

  return (
    <>
      <AuthorLayout content={mainContent}>
        <MDXLayoutRenderer code={author.body} />
      </AuthorLayout>
    </>
  )
}

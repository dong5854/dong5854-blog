import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from '@/lib/contentlayer'
import { getTagCounts } from '@/lib/tagCounts'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = decodeURI(rawTag)
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
    },
  })
}

export const generateStaticParams = async () => {
  const posts = allCoreContent(sortPosts(allBlogs))
  const tagCounts = getTagCounts(posts)
  return Object.keys(tagCounts).map((tag) => ({ tag }))
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params
  const tag = decodeURI(rawTag)
  // Capitalize first letter and convert space to dash
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
  const posts = allCoreContent(sortPosts(allBlogs))
  const tagCounts = getTagCounts(posts)
  const filteredPosts = posts.filter(
    (post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)
  )
  return <ListLayout posts={filteredPosts} title={title} tagCounts={tagCounts} />
}

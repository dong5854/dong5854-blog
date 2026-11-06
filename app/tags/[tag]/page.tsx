import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from '@/lib/contentlayer'
import { getTagCounts } from '@/lib/tagCounts'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

const guides: Record<string, { title: string; description: string }> = {
  emr: {
    title: 'AWS EMR 운영과 Spark 문제 해결',
    description:
      'EMR에서 Spark를 운영하며 겪은 큐 설정과 Livy 세션 대기 및 History Server 문제를 정리했습니다.',
  },
  yarn: {
    title: 'YARN 스케줄러와 큐 운영',
    description:
      'Capacity Scheduler와 Fair Scheduler의 차이를 살펴보고 큐 설정과 Spark 작업 대기 원인을 확인합니다.',
  },
  spark: {
    title: 'Apache Spark 운영과 장애 진단',
    description:
      'Spark on EMR의 실행 구조부터 작업 대기와 Livy 세션 실패 및 이벤트 로그 관리까지 다룹니다.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = decodeURI(rawTag)
  const guide = Object.hasOwn(guides, tag) ? guides[tag] : undefined
  return genPageMetadata({
    title: guide?.title ?? tag,
    description: guide?.description ?? `${siteMetadata.title} ${tag} tagged content`,
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
  const guide = Object.hasOwn(guides, tag) ? guides[tag] : undefined
  // Capitalize first letter and convert space to dash
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
  const posts = allCoreContent(sortPosts(allBlogs))
  const tagCounts = getTagCounts(posts)
  const filteredPosts = posts.filter(
    (post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)
  )
  return (
    <ListLayout
      posts={filteredPosts}
      title={guide?.title ?? title}
      tagCounts={tagCounts}
      intro={guide && <p className="mt-3 text-gray-600 dark:text-gray-300">{guide.description}</p>}
    />
  )
}

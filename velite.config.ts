import { defineCollection, s, type UserConfig } from 'velite'
import { mdxOptions } from './lib/mdx-options'
import siteMetadata from './data/siteMetadata'
const { siteUrl, socialBanner } = siteMetadata

const blogs = defineCollection({
  name: 'Blog',
  pattern: 'blog/**/*.mdx',
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      tags: s.array(s.string()).default([]),
      lastmod: s.isodate().optional(),
      draft: s.boolean().default(false),
      summary: s.string().optional(),
      images: s.any().optional(),
      authors: s.array(s.string()).optional(),
      layout: s.string().optional(),
      bibliography: s.string().optional(),
      canonicalUrl: s.string().optional(),
      body: s.mdx(),
      raw: s.raw(),
      toc: s.toc(),
      slug: s.path(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      const slugPath = data.slug
      const slug = slugPath.replace(/^.+?\//, '')
      return {
        ...data,
        slug,
        path: slugPath,
        filePath: slugPath + '.mdx',
        readingTime: data.metadata,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.title,
          datePublished: data.date,
          dateModified: data.lastmod || data.date,
          description: data.summary,
          image: new URL(
            (Array.isArray(data.images) ? data.images[0] : data.images) || socialBanner,
            siteUrl
          ).href,
          url: `${siteUrl}/${slugPath}`,
        },
      }
    }),
})

const authors = defineCollection({
  name: 'Authors',
  pattern: 'authors/**/*.mdx',
  schema: s
    .object({
      name: s.string(),
      avatar: s.string().optional(),
      occupation: s.string().optional(),
      company: s.string().optional(),
      email: s.string().optional(),
      twitter: s.string().optional(),
      linkedin: s.string().optional(),
      github: s.string().optional(),
      layout: s.string().optional(),
      body: s.mdx(),
      slugPath: s.path(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      const slug = data.slugPath.replace(/^.+?\//, '')
      return {
        ...data,
        slug,
        path: data.slugPath,
        filePath: data.slugPath + '.mdx',
      }
    }),
})

const config: UserConfig = {
  root: 'data',
  output: {
    assets: 'public/static/velite',
  },
  collections: { blogs, authors },
  mdx: mdxOptions,
}

export default config

import { defineCollection, defineConfig, s } from 'velite'
import remarkGfm from 'remark-gfm'
import { remarkCodeTitles } from './lib/remark/codeTitles'
import { remarkImgToJsx } from './lib/remark/convertImages'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'
const siteUrl = 'https://dong5854-blog-lac-one.vercel.app/'
const socialBanner = '/static/images/twitter-card.png'

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
          image: data.images ? data.images[0] : socialBanner,
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

export default defineConfig({
  root: 'data',
  collections: { blogs, authors },
  mdx: {
    remarkPlugins: [remarkGfm, remarkCodeTitles, remarkImgToJsx],
    rehypePlugins: [
      rehypeSlug,
      rehypeAutolinkHeadings,
      [rehypePrismPlus as any, { defaultLanguage: 'js', ignoreMissing: true }],
    ],
  },
})

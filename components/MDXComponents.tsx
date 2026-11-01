'use client'

import TOCInline from '@/components/mdx/TOCInline'
import Pre from '@/components/mdx/Pre'
import BlogNewsletterForm from '@/components/mdx/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import { CaptionedImage, MarkdownImage } from './mdx/CaptionedImage'
import CustomLink from './Link'
import ContentImage from './mdx/ContentImage'
import Source from './mdx/Source'
import Note from './mdx/Note'

export const components: MDXComponents = {
  Image: CaptionedImage,
  img: MarkdownImage,
  ContentImage,
  Source,
  Note,
  TOCInline,
  a: CustomLink as MDXComponents['a'],
  pre: Pre as MDXComponents['pre'],
  BlogNewsletterForm,
}

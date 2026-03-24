'use client'

import TOCInline from '@/components/mdx/TOCInline'
import Pre from '@/components/mdx/Pre'
import BlogNewsletterForm from '@/components/mdx/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink as MDXComponents['a'],
  pre: Pre as MDXComponents['pre'],
  BlogNewsletterForm,
}

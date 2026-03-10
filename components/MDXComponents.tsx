'use client'

import TOCInline from '@/components/mdx/TOCInline'
import Pre from '@/components/mdx/Pre'
import BlogNewsletterForm from '@/components/mdx/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink as any,
  pre: Pre as any,
  BlogNewsletterForm,
}
/* eslint-enable @typescript-eslint/no-explicit-any */

'use client'

import { useMemo } from 'react'
import { useMDXComponent } from 'next-contentlayer/hooks'
import type { MDXComponents } from 'mdx/types'
import { components as defaultComponents } from '@/components/MDXComponents'

interface MDXLayoutRendererProps {
  code: string
  components?: MDXComponents
  // allow additional props like toc, readingTime, etc.
  [key: string]: unknown
}

export function MDXLayoutRenderer({ code, components, ...rest }: MDXLayoutRendererProps) {
  const Component = useMDXComponent(code)
  const allComponents = useMemo(
    () => (components ? { ...defaultComponents, ...components } : defaultComponents),
    [components]
  )

  return <Component components={allComponents} {...rest} />
}

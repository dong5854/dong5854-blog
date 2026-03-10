'use client'

import { useMemo } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'
import { components as defaultComponents } from '@/components/MDXComponents'

const jsxRuntime = { Fragment, jsx, jsxs }

function useMDXComponent(code: string) {
  return useMemo(() => {
    const fn = new Function(code)
    return fn(jsxRuntime).default
  }, [code])
}

interface MDXLayoutRendererProps {
  code: string
  components?: MDXComponents
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

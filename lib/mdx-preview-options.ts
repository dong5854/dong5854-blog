import type { ProcessorOptions } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import { remarkCodeTitles } from './remark/codeTitles'

export const previewOptions: ProcessorOptions = {
  outputFormat: 'function-body',
  development: false,
  remarkPlugins: [remarkMath, remarkGfm, remarkCodeTitles],
  rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeKatex],
}

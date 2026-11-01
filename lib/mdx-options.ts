import type { CompileOptions } from '@mdx-js/mdx'
import rehypePrismPlus from 'rehype-prism-plus'
import { previewOptions } from './mdx-preview-options'
import { remarkImgToJsx } from './remark/convertImages'

export const mdxOptions: CompileOptions = {
  remarkPlugins: [...previewOptions.remarkPlugins!, remarkImgToJsx],
  rehypePlugins: [
    ...previewOptions.rehypePlugins!,
    [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
  ],
}

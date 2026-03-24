import type { Root, Code, Parent } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

export const remarkCodeTitles: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree as unknown as Parameters<typeof visit>[0], 'code', (node, index, parent) => {
      if (index == null || !parent) return

      const codeNode = node as unknown as Code
      const info = codeNode.lang ?? ''
      if (!info.includes(':')) return

      const [language, title] = info.split(':', 2)
      if (!title) return

      const titleNode = {
        type: 'mdxJsxFlowElement',
        name: 'div',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'className',
            value: 'remark-code-title',
          },
        ],
        children: [{ type: 'text', value: title }],
        data: { _mdxExplicitJsx: true },
      }

      ;(parent as Parent).children.splice(
        index,
        0,
        titleNode as unknown as Parent['children'][number]
      )
      codeNode.lang = language
    })
  }
}

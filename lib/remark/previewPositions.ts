import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

export type PreviewPositionProps = {
  'data-source-start'?: number
  'data-source-end'?: number
}

// Keep source offsets on rendered Markdown blocks, including images and code fences.
export const remarkPreviewPositions: Plugin<[], Root> = () => (tree) => {
  visit(tree as unknown as Parameters<typeof visit>[0], (node) => {
    if (node.position && node.type === 'mdxJsxFlowElement') {
      const element = node as typeof node & {
        attributes: Array<{ type: string; name: string; value: string }>
      }
      for (const [name, offset] of [
        ['data-source-start', node.position.start.offset],
        ['data-source-end', node.position.end.offset],
      ] as const) {
        if (
          offset !== undefined &&
          !element.attributes.some((attribute) => attribute.name === name)
        ) {
          element.attributes.push({ type: 'mdxJsxAttribute', name, value: String(offset) })
        }
      }
    }
    if (
      !node.position ||
      ![
        'heading',
        'paragraph',
        'code',
        'blockquote',
        'list',
        'listItem',
        'table',
        'thematicBreak',
        'math',
      ].includes(node.type)
    )
      return
    node.data ??= {}
    node.data.hProperties = {
      ...(node.data.hProperties as Record<string, unknown> | undefined),
      'data-source-start': node.position.start.offset,
      'data-source-end': node.position.end.offset,
    }
  })
}

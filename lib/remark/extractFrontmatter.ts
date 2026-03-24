import type { Parent, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import yaml from 'js-yaml'

type UnifiedPlugin = Plugin<[], Root>

const remarkExtractFrontmatterPlugin: UnifiedPlugin = function () {
  return (tree, file) => {
    visit(tree as unknown as Parameters<typeof visit>[0], 'yaml', (node, index, parent) => {
      if (index == null || !parent) return

      try {
        ;(file.data as Record<string, unknown>).frontmatter =
          yaml.load((node as unknown as { value: string }).value) ?? {}
      } catch (error) {
        console.warn('Failed to parse frontmatter', error)
      }

      ;(parent as unknown as Parent).children.splice(index, 1)
    })
  }
}

export const remarkExtractFrontmatter = remarkExtractFrontmatterPlugin

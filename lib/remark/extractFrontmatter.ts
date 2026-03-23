import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import yaml from 'js-yaml'

type UnifiedPlugin = Plugin<[], Root>

const remarkExtractFrontmatterPlugin: UnifiedPlugin = function () {
  return (tree, file) => {
    visit(tree as any, 'yaml', (node: any, index: any, parent: any) => {
      if (index == null || !parent) return

      try {
        ;(file.data as Record<string, unknown>).frontmatter = yaml.load((node as any).value) ?? {}
      } catch (error) {
        console.warn('Failed to parse frontmatter', error)
      }

      parent.children.splice(index, 1)
    })
  }
}

export const remarkExtractFrontmatter = remarkExtractFrontmatterPlugin

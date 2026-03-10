import fs from 'fs'
import { sync as probe } from 'probe-image-size'
import type { Image, Paragraph, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type MutableImage = Image & {
  type: string
  name?: string
  attributes?: Array<{ type: 'mdxJsxAttribute'; name: string; value: string | number }>
  children?: []
}

export const remarkImgToJsx: Plugin<[], Root> = function () {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      const paragraph = node as Paragraph
      const imageIndex = paragraph.children.findIndex((child) => child.type === 'image')
      if (imageIndex === -1) {
        return
      }

      const imageNode = paragraph.children[imageIndex] as MutableImage
      const absolutePath = `${process.cwd()}/public${imageNode.url}`
      if (!fs.existsSync(absolutePath)) {
        return
      }

      const result = probe(fs.readFileSync(absolutePath))
      if (!result) return
      const { width, height } = result
      const mdxNode = {
        type: 'mdxJsxFlowElement',
        name: 'Image',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'alt', value: imageNode.alt ?? '' },
          { type: 'mdxJsxAttribute', name: 'src', value: imageNode.url },
          { type: 'mdxJsxAttribute', name: 'width', value: width },
          { type: 'mdxJsxAttribute', name: 'height', value: height },
        ],
        children: [] as [],
      }

      paragraph.children.splice(imageIndex, 1, mdxNode as unknown as Paragraph['children'][number])
      ;(paragraph as unknown as { type: string }).type = 'div'
    })
  }
}

import { remark } from 'remark'
import type { Heading, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'

export type TocItem = {
  value: string
  url: string
  depth: number
}

export const remarkTocHeadings: Plugin<[], Root> = function () {
  return (tree, file) => {
    const slugger = new GithubSlugger()
    const toc: TocItem[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree as any, 'heading', (node: any) => {
      const heading = node as Heading
      const text = toString(heading).trim()
      if (!text) return

      const slug = slugger.slug(text)
      toc.push({ value: text, url: `#${slug}`, depth: heading.depth })
    })

    file.data.toc = toc
  }
}

export async function extractTocHeadings(markdown: string) {
  const file = await remark().use(remarkTocHeadings).process(markdown)
  const toc = (file.data.toc as TocItem[]) ?? []
  return JSON.stringify(toc)
}

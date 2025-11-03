import GithubSlugger from 'github-slugger'

export type TagCountMap = Record<string, number>

type HasTags = {
  tags?: string[] | null
}

export function getTagCounts<T extends HasTags>(items: T[]): TagCountMap {
  return items.reduce<TagCountMap>((acc, item) => {
    if (!item.tags) return acc
    item.tags.forEach((tag) => {
      if (!tag) return
      const key = GithubSlugger.slug(tag)
      acc[key] = (acc[key] ?? 0) + 1
    })
    return acc
  }, {})
}

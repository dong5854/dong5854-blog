type RelatedPost = {
  path: string
  title: string
  date: string
  tags: string[]
  draft?: boolean
}

export function getRelatedPosts<T extends RelatedPost>(post: RelatedPost, posts: T[]): T[] {
  const tags = new Set(post.tags.map((tag) => tag.toLowerCase()))

  return posts
    .filter((candidate) => !candidate.draft && candidate.path !== post.path)
    .map((candidate) => ({
      post: candidate,
      sharedTags: new Set(
        candidate.tags.map((tag) => tag.toLowerCase()).filter((tag) => tags.has(tag))
      ).size,
    }))
    .filter((candidate) => candidate.sharedTags > 0)
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        b.post.date.localeCompare(a.post.date) ||
        a.post.path.localeCompare(b.post.path)
    )
    .slice(0, 3)
    .map((candidate) => candidate.post)
}

type RelatedPost = {
  path: string
  title: string
  date: string
  tags: string[]
  draft?: boolean
}

const preferredPosts: Record<string, string> = {
  'blog/spark/emr-livy-session': 'blog/spark/emr-yarn-application-master',
  'blog/spark/emr-yarn-application-master': 'blog/spark/emr-livy-session',
  'blog/spark/yarn-fair-vs-capacity-scheduler':
    'blog/spark/yarn-capacity-scheduler-tuning-and-troubleshooting',
  'blog/spark/yarn-capacity-scheduler-tuning-and-troubleshooting':
    'blog/spark/yarn-fair-vs-capacity-scheduler',
}

export function getRelatedPosts<T extends RelatedPost>(post: RelatedPost, posts: T[]): T[] {
  const tags = new Set(post.tags.map((tag) => tag.toLowerCase()))

  return posts
    .filter((candidate) => !candidate.draft && candidate.path !== post.path)
    .map((candidate) => ({
      post: candidate,
      preferred: Number(candidate.path === preferredPosts[post.path]),
      sharedTags: new Set(
        candidate.tags.map((tag) => tag.toLowerCase()).filter((tag) => tags.has(tag))
      ).size,
    }))
    .filter((candidate) => candidate.preferred || candidate.sharedTags > 0)
    .sort(
      (a, b) =>
        b.preferred - a.preferred ||
        b.sharedTags - a.sharedTags ||
        b.post.date.localeCompare(a.post.date) ||
        a.post.path.localeCompare(b.post.path)
    )
    .slice(0, 3)
    .map((candidate) => candidate.post)
}

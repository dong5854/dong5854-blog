import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from '@/lib/contentlayer'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}

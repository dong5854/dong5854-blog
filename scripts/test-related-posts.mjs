import assert from 'node:assert/strict'
import { build } from 'esbuild'

const output = await build({
  entryPoints: ['lib/relatedPosts.ts'],
  bundle: true,
  format: 'esm',
  write: false,
})
const { getRelatedPosts } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`
)
const post = {
  path: 'blog/spark/current',
  title: 'Current',
  date: '2026-11-01',
  tags: ['Spark', 'YARN'],
}
const candidate = (path, tags, date = '2026-10-01', draft = false) => ({
  path,
  title: path,
  tags,
  date,
  draft,
})
const posts = [
  post,
  candidate('draft', ['spark', 'yarn'], '2026-11-03', true),
  candidate('unrelated', ['react']),
  candidate('broad-newer', ['spark'], '2026-11-02'),
  candidate('closest', ['spark', 'yarn']),
  candidate('duplicates', ['spark', 'spark', 'spark']),
  candidate('older', ['yarn'], '2026-01-01'),
]
const original = structuredClone(posts)
assert.deepEqual(
  getRelatedPosts(post, posts).map((p) => p.path),
  ['closest', 'broad-newer', 'duplicates']
)
assert.deepEqual(posts, original, 'selection must not reorder or mutate source posts')
assert.deepEqual(getRelatedPosts({ ...post, tags: [] }, posts), [])
assert.deepEqual(getRelatedPosts(post, [post, posts[1], posts[2]]), [])
console.log(
  'PASS: relevant published posts only, case-insensitive tags, no duplicate-tag bias, stable order, three links, no mutation'
)

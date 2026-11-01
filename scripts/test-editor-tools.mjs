import assert from 'node:assert/strict'
import { build } from 'esbuild'
async function load(file) {
  const result = await build({ entryPoints: [file], bundle: true, format: 'esm', write: false })
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  )
}
const { readDraft, writeDraft, removeDraft, draftFiles } = await load('lib/editorDrafts.ts')
const map = new Map()
const storage = {
  get length() {
    return map.size
  },
  key: (i) => [...map.keys()][i] ?? null,
  getItem: (key) => map.get(key) ?? null,
  setItem: (key, value) => map.set(key, value),
  removeItem: (key) => map.delete(key),
}
const post = {
  file: 'test/post.mdx',
  body: '한글\n![이미지](/test.png)',
  title: '제목',
  tags: ['a'],
  revision: 'base',
  draft: true,
}
writeDraft(storage, post)
assert.deepEqual(readDraft(storage, post.file).post, post)
assert.deepEqual(draftFiles(storage), [post.file])
assert.equal(readDraft(storage, 'another.mdx'), null)
assert.equal(
  readDraft(storage, post.file).post.revision,
  'base',
  'preserve original revision for conflict protection'
)
map.set('local-mdx-draft:v1:broken', '{')
map.set('local-mdx-draft:v1:wrong', JSON.stringify({ post, updatedAt: 1 }))
assert.equal(readDraft(storage, 'broken'), null)
assert.equal(readDraft(storage, 'wrong'), null)
assert.deepEqual(draftFiles(storage), [post.file])
removeDraft(storage, post.file)
assert.equal(readDraft(storage, post.file), null)
assert.throws(
  () =>
    writeDraft(
      {
        setItem() {
          throw new Error('quota')
        },
      },
      post
    ),
  /quota/
)
const { findMatches, scrollRatio } = await load('lib/editorSearch.ts')
assert.deepEqual(findMatches('aaa', 'aa'), [0])
assert.deepEqual(findMatches('ABC abc ABC', 'ABC'), [0, 8])
assert.deepEqual(findMatches('가나다 가나다', '가나'), [0, 4])
assert.deepEqual(findMatches('a.b a.b', 'a.b'), [0, 4])
assert.deepEqual(findMatches('text', ''), [])
assert.equal(scrollRatio(50, 200, 100), 0.5)
assert.equal(scrollRatio(50, 100, 100), 0)
assert.equal(scrollRatio(-10, 200, 100), 0)
assert.equal(scrollRatio(200, 200, 100), 1)
console.log(
  'PASS: draft roundtrip/isolation/corruption/quota/revision, literal search, bounded scroll ratio'
)

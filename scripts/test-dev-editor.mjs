import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const cwd = process.cwd()
const directory = await mkdtemp(path.join(tmpdir(), 'mdx-editor-test-'))
const originalEnvironment = process.env.NODE_ENV
try {
  const bundle = await build({
    stdin: {
      contents: "export * from './lib/dev/access'; export * from './lib/dev/files'",
      resolveDir: cwd,
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
  })
  await writeFile(path.join(directory, 'helpers.cjs'), bundle.outputFiles[0].text)
  await mkdir(path.join(directory, 'data/blog'), { recursive: true })
  process.chdir(directory)
  const { localDevRequest, readPost, listPosts, savePost, postPath, createPost, listFolders } =
    createRequire(import.meta.url)(path.join(directory, 'helpers.cjs'))
  process.env.NODE_ENV = 'development'
  assert.equal(
    localDevRequest(new Headers({ host: 'localhost:3000', origin: 'http://localhost:3000' })),
    true
  )
  for (const headers of [
    { host: 'example.com' },
    { host: 'localhost:3000', origin: 'https://evil.test' },
    { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' },
  ])
    assert.equal(localDevRequest(new Headers(headers)), false)
  process.env.NODE_ENV = 'production'
  assert.equal(localDevRequest(new Headers({ host: 'localhost:3000' })), false)
  const source =
    "---\ntitle: 'Test'\ndate: '2026-10-29'\ntags: ['test']\ndraft: true\ncustom: keep\n---\n\n# Hello\n"
  await writeFile('data/blog/test.mdx', source)
  assert.deepEqual(await listPosts(), ['test.mdx'])
  const post = await readPost('test.mdx')
  const saved = await savePost({ ...post, body: '\n# Updated\n' })
  assert.equal(await readFile('data/blog/test.mdx', 'utf8'), source.replace('# Hello', '# Updated'))
  await assert.rejects(savePost({ ...post, body: 'stale' }), /외부에서 변경/)
  await savePost({
    ...post,
    revision: saved.revision,
    title: 'New title',
    tags: ['new'],
    body: '\n# Updated\n',
  })
  const updated = await readFile('data/blog/test.mdx', 'utf8')
  assert.match(updated, /custom: keep/)
  assert.match(updated, /draft: true/)
  await assert.rejects(postPath('../outside.mdx'))
  await writeFile('outside.mdx', 'private')
  await symlink(path.join(directory, 'outside.mdx'), 'data/blog/link.mdx')
  await assert.rejects(postPath('link.mdx'), /허용되지/)
  const concurrent = await readPost('test.mdx')
  const results = await Promise.allSettled([
    savePost({ ...concurrent, body: 'first' }),
    savePost({ ...concurrent, body: 'second' }),
  ])
  assert.deepEqual(
    results.map((result) => result.status),
    ['fulfilled', 'rejected']
  )
  const newInput = {
    file: 'new-category/new-post.mdx',
    title: '새 글',
    tags: [],
    date: '2026-10-29',
    body: '\n# 새 본문\n',
  }
  const created = await createPost(newInput)
  assert.equal(created.draft, true)
  assert.ok((await listFolders()).includes('new-category'))
  await mkdir('data/blog/empty-folder')
  assert.ok((await listFolders()).includes('empty-folder'))
  assert.equal(created.title, '새 글')
  assert.match(created.source, /2026-10-29/)
  await assert.rejects(createPost(newInput), /이미 있습니다/)
  assert.equal((await readPost(newInput.file)).source, created.source)
  await savePost({ ...created, draft: false })
  assert.equal((await readPost(newInput.file)).draft, false)
  for (const file of ['../outside.mdx', '/outside.mdx', 'new-category/.mdx', 'foo//bar.mdx'])
    await assert.rejects(createPost({ ...newInput, file }))
  await assert.rejects(
    createPost({ ...newInput, file: 'invalid-date.mdx', date: '2026-02-30' }),
    /작성일/
  )
  await symlink(directory, 'data/blog/outside-folder')
  await assert.rejects(createPost({ ...newInput, file: 'outside-folder/no-write.mdx' }), /허용되지/)
  console.log(
    'PASS: create draft, duplicate protection, draft toggle, date/path/symlink validation'
  )
  const fsPromises = (await import('node:fs/promises')).default
  const realWrite = fsPromises.writeFile
  const beforeFailure = await readPost('test.mdx')
  try {
    fsPromises.writeFile = async (file, ...args) => {
      if (String(file).endsWith('.tmp')) throw new Error('simulated disk failure')
      return realWrite(file, ...args)
    }
    await assert.rejects(
      savePost({ ...beforeFailure, body: 'must not truncate' }),
      /simulated disk failure/
    )
    assert.equal((await readPost('test.mdx')).source, beforeFailure.source)
  } finally {
    fsPromises.writeFile = realWrite
  }
  console.log(
    'PASS: development/local origin guards, metadata preservation, path/symlink rejection, stale and concurrent saves'
  )
} finally {
  process.chdir(cwd)
  if (originalEnvironment === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalEnvironment
  await rm(directory, { recursive: true, force: true })
}

// The worker must never cache development CSS, including with an already-installed worker.
const { runInNewContext } = await import('node:vm')
const worker = await readFile(path.join(cwd, 'public/sw.js'), 'utf8')
for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'blog.example']) {
  const handlers = {}
  let intercepted = false
  const origin = `http://${hostname}`
  runInNewContext(worker, {
    URL,
    self: {
      location: { hostname, origin },
      addEventListener: (name, handler) => {
        handlers[name] = handler
      },
    },
    caches: { match: async () => new Response('cached') },
  })
  handlers.fetch({
    request: new Request(`${origin}/_next/static/development.css`),
    respondWith: () => {
      intercepted = true
    },
  })
  assert.equal(intercepted, hostname === 'blog.example')
}
console.log('PASS: cached development CSS is bypassed on every loopback hostname')

// MDX flow elements wrap Markdown text in paragraphs; a surrounding <p> is invalid HTML.
const { compile } = await import('@mdx-js/mdx')
const remarkMath = (await import('remark-math')).default
const remarkGfm = (await import('remark-gfm')).default
const matter = (await import('gray-matter')).default
const { readdir } = await import('node:fs/promises')
const paths = await readdir(path.join(cwd, 'data/blog'), { recursive: true })
function validParagraphs() {
  return (tree) => {
    function check(node, withinParagraph = false) {
      const isParagraph =
        node.type === 'paragraph' || (node.type === 'mdxJsxFlowElement' && node.name === 'p')
      assert.ok(!(withinParagraph && isParagraph), 'nested paragraph in MDX')
      for (const child of node.children ?? []) check(child, withinParagraph || isParagraph)
    }
    check(tree)
  }
}
await assert.rejects(
  compile('<p>\ntext\n</p>', { remarkPlugins: [remarkMath, remarkGfm, validParagraphs] }),
  /nested paragraph/
)
for (const file of paths.filter((file) => file.endsWith('.mdx'))) {
  const source = await readFile(path.join(cwd, 'data/blog', file), 'utf8')
  await compile(matter(source).content, { remarkPlugins: [remarkMath, remarkGfm, validParagraphs] })
}
console.log(
  'PASS: all blog MDX files compile without nested paragraphs; failed writes preserve the original'
)

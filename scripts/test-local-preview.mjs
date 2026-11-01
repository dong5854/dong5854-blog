import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Worker } from 'node:worker_threads'
import { build } from 'esbuild'
import matter from 'gray-matter'

const { outputFiles } = await build({
  entryPoints: ['app/dev/editor/preview.worker.ts'],
  bundle: true,
  platform: 'browser',
  conditions: ['worker'],
  format: 'iife',
  write: false,
})
// Run the browser bundle without a DOM, as a real Web Worker does.
const worker = new Worker(
  `
  const { parentPort } = require('node:worker_threads');
  globalThis.self = globalThis;
  self.postMessage = (data) => parentPort.postMessage(data);
  parentPort.on('message', (data) => self.onmessage({ data }));
  ${outputFiles[0].text}
`,
  { eval: true }
)
const messages = []
const waiters = []
worker.on('message', (message) => {
  messages.push(message)
  for (const wake of waiters.splice(0)) wake()
})
worker.on('error', (error) => {
  throw error
})
async function until(predicate) {
  const timeout = setTimeout(() => {
    throw new Error('Worker timed out')
  }, 10000)
  try {
    while (!messages.some(predicate)) await new Promise((resolve) => waiters.push(resolve))
    return messages.find(predicate)
  } finally {
    clearTimeout(timeout)
  }
}
try {
  await until((m) => m.phase === 'ready')
  worker.postMessage({
    id: 1,
    body: '# Preview &amp; test\n\n$x^2$\n\n```js\nconst x = 1\n```\n\n![image](/test.png)\n\n<ContentImage src="/test.png" />\n\n<Source title="Gemini" />\n\n<Note text="참고" />',
  })
  const fast = await until((m) => m.id === 1 && m.phase === 'fast')
  assert.ok(!fast.error)
  assert.match(fast.code, /katex/)
  assert.match(fast.code, /test.png/)
  assert.match(fast.code, /Preview & test/)
  assert.match(fast.code, /data-source-start/)
  assert.match(fast.code, /data-source-end/)
  assert.match(fast.code, /ContentImage/)
  const full = await until((m) => m.id === 1 && m.phase === 'highlight')
  assert.match(full.code, /token keyword/)
  assert.match(full.code, /data-source-start/)
  worker.postMessage({ id: 2, body: '<div>' })
  assert.ok((await until((m) => m.id === 2)).error)
  worker.postMessage({ id: 3, body: '' })
  assert.ok(!(await until((m) => m.id === 3 && m.phase === 'fast')).error)
  const body = matter(
    await readFile('data/blog/ML/ridge-regression-from-scratch.mdx', 'utf8')
  ).content
  const timings = []
  for (let id = 4; id < 10; id++) {
    const start = performance.now()
    worker.postMessage({ id, body })
    const result = await until((m) => m.id === id && m.phase === 'fast')
    assert.ok(!result.error, result.error)
    timings.push(Math.round(performance.now() - start))
  }
  await until((m) => m.id === 9 && m.phase === 'highlight')
  assert.ok(
    !messages.some((m) => m.id >= 3 && m.id < 9 && m.phase === 'highlight'),
    'superseded highlighting is cancelled'
  )
  console.log(`Worker tests passed; long article fast compile (ms): ${timings.join(', ')}`)
} finally {
  await worker.terminate()
}

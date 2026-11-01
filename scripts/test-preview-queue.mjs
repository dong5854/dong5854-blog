import assert from 'node:assert/strict'
import { build } from 'esbuild'

const output = await build({
  entryPoints: ['lib/previewQueue.ts'],
  bundle: true,
  format: 'esm',
  write: false,
})
const { createPreviewQueue } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`
)
const calls = [],
  results = [],
  errors = []
const queue = createPreviewQueue(
  (body, signal) => new Promise((resolve, reject) => calls.push({ body, signal, resolve, reject })),
  (code) => results.push(code),
  (error) => errors.push(error)
)
queue.submit('first')
assert.equal(calls.length, 1, 'first edit starts without a debounce timer')
queue.submit('second')
queue.submit('latest')
assert.equal(calls.length, 1, 'requests must not overlap')
calls[0].resolve('first rendered')
await new Promise((resolve) => setImmediate(resolve))
assert.deepEqual(results, ['first rendered'], 'preview progresses while typing continues')
assert.equal(calls[1].body, 'latest', 'intermediate keystrokes are coalesced')
queue.submit('')
calls[1].reject(new Error('outdated syntax error'))
await new Promise((resolve) => setImmediate(resolve))
assert.equal(calls[2].body, '', 'empty content must still render')
assert.deepEqual(errors, [], 'do not flash an error from an outdated edit')
calls[2].reject(new Error('current syntax error'))
await new Promise((resolve) => setImmediate(resolve))
assert.equal(errors.length, 1)
queue.submit('switching files')
queue.dispose()
assert.equal(calls[3].signal.aborted, true)
calls[3].resolve('must not show in the next file')
await new Promise((resolve) => setImmediate(resolve))
assert.deepEqual(results, ['first rendered'])
queue.submit('ignored')
assert.equal(calls.length, 4)
console.log(
  'PASS: immediate preview, one in-flight request, latest-edit coalescing, progress during typing, errors, empty body, file-switch cancellation'
)

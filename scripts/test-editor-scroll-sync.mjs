import assert from 'node:assert/strict'
import { build } from 'esbuild'

const { outputFiles } = await build({
  entryPoints: ['lib/editorScrollSync.ts'],
  bundle: true,
  format: 'esm',
  write: false,
})
const { mappedScroll } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
)
// A one-line image occupies 600px in the preview. Following paragraphs must
// keep their own positions instead of inheriting the whole document's ratio.
const anchors = [
  { editor: 0, preview: 0 },
  { editor: 100, preview: 100 },
  { editor: 132, preview: 700 },
  { editor: 300, preview: 900 },
  { editor: 1000, preview: 1600 },
]
assert.equal(mappedScroll(anchors, 132, 'editor'), 700)
assert.equal(mappedScroll(anchors, 300, 'editor'), 900)
assert.equal(mappedScroll(anchors, 400, 'preview'), 116)
assert.equal(mappedScroll(anchors, 900, 'preview'), 300)
assert.equal(mappedScroll(anchors, 650, 'editor'), 1250)
assert.equal(mappedScroll(anchors, -50, 'editor'), 0)
assert.equal(mappedScroll(anchors, 9999, 'editor'), 1600)
assert.equal(mappedScroll([], 100, 'preview'), 0)
assert.equal(mappedScroll([{ editor: 0, preview: 0 }], 100, 'editor'), 0)
assert.equal(
  mappedScroll(
    [
      { editor: 0, preview: 0 },
      { editor: 0, preview: 600 },
    ],
    0,
    'editor'
  ),
  0
)
console.log('PASS: image height interpolation, bidirectional scroll, document boundaries')

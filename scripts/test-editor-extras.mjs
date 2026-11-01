import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
async function load(file) {
  const result = await build({ entryPoints: [file], bundle: true, format: 'esm', write: false })
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  )
}
const { continueList, indentLines, lineBoundarySelection } = await load('lib/editorFormatting.ts')
for (const [body, text] of [
  ['- item', '\n- '],
  ['  - [x] done', '\n  - [ ] '],
  ['9. nine', '\n10. '],
  ['> quote', '\n> '],
]) {
  assert.equal(continueList(body, body.length, body.length).text, text)
}
assert.deepEqual(continueList('- ', 2, 2), { start: 0, end: 2, text: '' })
assert.equal(continueList('```js\n- item', 12, 12), null)
assert.equal(continueList('text', 4, 4), null)
assert.equal(continueList('- item', 0, 6), null)
assert.equal(indentLines('one\ntwo', 0, 7, false).text, '  one\n  two')
assert.equal(indentLines('  one\n\ttwo', 0, 10, true).text, 'one\ntwo')
assert.equal(indentLines('abc', 1, 1, false).text, '  ')
assert.equal(indentLines('\ntext', 0, 5, false).start, 0)
const { diffLines } = await load('lib/editorDiff.ts')
for (const [before, after] of [
  ['a\nb\nc', 'a\nx\nc'],
  ['', 'abc'],
  ['a\na', 'a'],
  ['x', 'x'],
  ['a\nb', 'b\na'],
  ['1\n'.repeat(1100), '2\n'.repeat(1100)],
]) {
  const result = diffLines(before, after)
  assert.equal(
    result
      .filter((l) => l.kind !== 'added')
      .map((l) => l.text)
      .join('\n'),
    before
  )
  assert.equal(
    result
      .filter((l) => l.kind !== 'removed')
      .map((l) => l.text)
      .join('\n'),
    after
  )
}
const { editableImages, imageMarkup } = await load('lib/editorImages.ts')
const original = 'before\n![설명](/static/test.png)\nafter'
const image = editableImages(original)[0]
assert.equal(original.slice(image.start, image.end), image.source)
const generated = imageMarkup({ ...image, alt: '"<&>{test}', width: '320', align: 'right' })
assert.equal(editableImages(generated)[0].alt, '"<&>{test}')
assert.equal(editableImages(generated)[0].width, '320')
const { default: ContentImage } = await load('components/mdx/ContentImage.tsx')
const { default: MDX } = await run(
  await compile(generated, { outputFormat: 'function-body' }),
  runtime
)
const html = renderToStaticMarkup(runtime.jsx(MDX, { components: { ContentImage } }))
assert.match(html, /text-align:right/)
assert.match(html, /width:320px/)
assert.match(html, /src="\/static\/test.png"/)
assert.deepEqual(editableImages('```md\n![skip](/x.png)\n```\n`![skip](/x.png)`'), [])
assert.deepEqual(editableImages('![bad](javascript:alert)'), [])
assert.throws(() => imageMarkup({ ...image, width: '0' }))
assert.throws(() => imageMarkup({ ...image, width: '2401' }))
assert.throws(() => imageMarkup({ ...image, align: 'bad' }))
console.log(
  'PASS: list continuation/exit/code exclusion, indent, diff reconstruction and large fallback, image offsets/escaping/validation/MDX compilation'
)

assert.deepEqual(lineBoundarySelection('first\nsecond\nlast', 9, 9, 'none', 'Home', false), [
  6,
  6,
  'none',
])
assert.deepEqual(lineBoundarySelection('first\nsecond\nlast', 9, 9, 'none', 'End', false), [
  12,
  12,
  'none',
])
assert.deepEqual(lineBoundarySelection('first\nsecond\nlast', 9, 9, 'none', 'Home', true), [
  6,
  9,
  'backward',
])
assert.deepEqual(lineBoundarySelection('first\nsecond\nlast', 6, 9, 'backward', 'End', true), [
  9,
  12,
  'forward',
])
assert.deepEqual(lineBoundarySelection('\nlast', 0, 0, 'none', 'Home', false), [0, 0, 'none'])
assert.deepEqual(lineBoundarySelection('\nlast', 3, 3, 'none', 'End', false), [5, 5, 'none'])
console.log('PASS: Home/End line boundaries, Shift selection and direction, empty/first/last lines')

import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
async function load(file) {
  const output = await build({ entryPoints: [file], bundle: true, format: 'esm', write: false })
  return import(
    `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`
  )
}
const { editorTemplates } = await load('lib/editorTemplates.ts')
const { default: Source } = await load('components/mdx/Source.tsx')
const { default: Note } = await load('components/mdx/Note.tsx')
const source =
  '<Source title="공식 &quot;문서&quot; &lt;설명&gt; {test}" href="https://example.com/docs?a=1&amp;b=2" />'
const note = '<Note title="참고" text="첫 줄&#10;둘째 줄 {중괄호} &lt;태그&gt; &quot;인용&quot;" />'
for (const [, markup] of editorTemplates) {
  const { default: Placeholder } = await run(
    await compile(markup, { outputFormat: 'function-body' }),
    runtime
  )
  assert.ok(renderToStaticMarkup(runtime.jsx(Placeholder, { components: { Source, Note } })))
}
const { default: MDX } = await run(
  await compile(`본문\n${source}${note}`, { outputFormat: 'function-body' }),
  runtime
)
const html = renderToStaticMarkup(runtime.jsx(MDX, { components: { Source, Note } }))
assert.match(html, /공식 &quot;문서&quot; &lt;설명&gt; \{test\}/)
assert.match(html, /첫 줄\n둘째 줄 \{중괄호\} &lt;태그&gt; &quot;인용&quot;/)
assert.match(html, /href="https:\/\/example.com\/docs\?a=1&amp;b=2"/)
assert.match(html, /rel="noopener noreferrer"/)
assert.match(html, /<aside/)
assert.match(renderToStaticMarkup(runtime.jsx(Source, { title: 'Gemini' })), />출처<\/span>/)
assert.match(
  renderToStaticMarkup(runtime.jsx(Source, { label: '이미지 생성', title: 'Gemini' })),
  />이미지 생성<\/span>/
)
for (const label of ['', '   ']) {
  const caption = renderToStaticMarkup(runtime.jsx(Source, { label, title: 'Gemini' }))
  assert.ok(caption.includes('Gemini'))
  assert.ok(!caption.includes('mr-2'))
}
assert.ok(
  !renderToStaticMarkup(
    runtime.jsx(Source, { title: 'unsafe', href: 'javascript:alert(1)' })
  ).includes('href=')
)
console.log(
  'PASS: source/note MDX compile and render, placeholders, multiline text, unsafe link protection'
)

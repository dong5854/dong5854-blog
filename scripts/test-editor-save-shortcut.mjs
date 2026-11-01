import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({
  entryPoints: ['lib/editorSaveShortcut.ts'],
  bundle: true,
  format: 'esm',
  write: false,
})
const { bindEditorSaveShortcut } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
)
let listener,
  saved = 0
const target = {
  addEventListener(type, callback, capture) {
    assert.equal(type, 'keydown')
    assert.equal(capture, true)
    listener = callback
  },
  removeEventListener(type, callback, capture) {
    assert.equal(callback, listener)
    assert.equal(capture, true)
    listener = null
  },
}
const dispose = bindEditorSaveShortcut(target, () => saved++)
function press(overrides) {
  let prevented = false
  listener({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    repeat: false,
    preventDefault() {
      prevented = true
    },
    stopPropagation() {},
    ...overrides,
  })
  return prevented
}
assert.equal(press({}), true)
assert.equal(press({ key: 'ㄴ' }), true)
assert.equal(press({ key: 'S' }), true)
assert.equal(press({ ctrlKey: false, metaKey: true }), true)
assert.equal(saved, 4)
assert.equal(press({ repeat: true }), true)
assert.equal(saved, 4)
assert.equal(press({ ctrlKey: false }), false)
assert.equal(press({ altKey: true }), false)
assert.equal(press({ key: 'f', code: 'KeyF' }), false)
dispose()
assert.equal(listener, null)
console.log(
  'PASS: Ctrl/Cmd+S, Korean key, uppercase, repeat prevention, unrelated keys, capture cleanup'
)

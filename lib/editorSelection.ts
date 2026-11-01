// A textarea exposes no caret coordinates. Measure the same wrapped text off-screen.
export function revealSelection(field: HTMLTextAreaElement, start: number, end: number) {
  field.focus()
  field.setSelectionRange(start, end)
  const style = getComputedStyle(field)
  const mirror = document.createElement('div')
  for (const property of [
    'font',
    'line-height',
    'letter-spacing',
    'tab-size',
    'padding',
    'border',
    'box-sizing',
    'word-break',
    'overflow-wrap',
  ]) {
    mirror.style.setProperty(property, style.getPropertyValue(property))
  }
  Object.assign(mirror.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    visibility: 'hidden',
    width: `${field.clientWidth}px`,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  })
  mirror.textContent = field.value.slice(0, start)
  const marker = document.createElement('span')
  marker.textContent = field.value.slice(start, end) || '\u200b'
  mirror.append(marker)
  document.body.append(mirror)
  field.scrollTop = Math.max(0, marker.offsetTop - field.clientHeight / 2)
  mirror.remove()
}

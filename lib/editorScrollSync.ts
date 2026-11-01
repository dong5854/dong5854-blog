export type ScrollAnchor = { editor: number; preview: number }

export function mappedScroll(anchors: ScrollAnchor[], top: number, source: 'editor' | 'preview') {
  const target = source === 'editor' ? 'preview' : 'editor'
  if (!anchors.length) return 0
  for (let i = 1; i < anchors.length; i++) {
    const left = anchors[i - 1]
    const right = anchors[i]
    if (top <= right[source]) {
      const distance = right[source] - left[source]
      const ratio = distance > 0 ? Math.max(0, (top - left[source]) / distance) : 0
      return left[target] + ratio * (right[target] - left[target])
    }
  }
  return anchors[anchors.length - 1][target]
}

export function measureScrollAnchors(field: HTMLTextAreaElement, pane: HTMLElement) {
  const blocks = Array.from(pane.querySelectorAll<HTMLElement>('[data-source-start]'))
  const offsets = [
    ...new Set(
      blocks.flatMap((block) => [
        Number(block.dataset.sourceStart),
        Number(block.dataset.sourceEnd),
      ])
    ),
  ]
    .filter((offset) => Number.isFinite(offset) && offset >= 0 && offset <= field.value.length)
    .sort((a, b) => a - b)
  const mirror = document.createElement('div')
  const style = getComputedStyle(field)
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
  const markers = new Map<number, HTMLSpanElement>()
  let previous = 0
  for (const offset of offsets) {
    mirror.append(document.createTextNode(field.value.slice(previous, offset)))
    const marker = document.createElement('span')
    marker.textContent = '\u200b'
    mirror.append(marker)
    markers.set(offset, marker)
    previous = offset
  }
  mirror.append(document.createTextNode(field.value.slice(previous)))
  document.body.append(mirror)
  const origin = mirror.getBoundingClientRect().top
  const positions = new Map(
    [...markers].map(([offset, marker]) => [offset, marker.getBoundingClientRect().top - origin])
  )
  mirror.remove()
  const paneTop = pane.getBoundingClientRect().top
  const points: ScrollAnchor[] = [{ editor: 0, preview: 0 }]
  for (const block of blocks) {
    const rect = block.getBoundingClientRect()
    const start = positions.get(Number(block.dataset.sourceStart))
    const end = positions.get(Number(block.dataset.sourceEnd))
    if (start !== undefined)
      points.push({ editor: start, preview: rect.top - paneTop + pane.scrollTop })
    if (end !== undefined)
      points.push({
        editor: end + parseFloat(style.lineHeight),
        preview: rect.bottom - paneTop + pane.scrollTop,
      })
  }
  const editorMax = Math.max(0, field.scrollHeight - field.clientHeight)
  const previewMax = Math.max(0, pane.scrollHeight - pane.clientHeight)
  // Clamping both axes keeps the beginning and end reachable in panes of different heights.
  const anchors: ScrollAnchor[] = [{ editor: 0, preview: 0 }]
  for (const point of points.sort((a, b) => a.editor - b.editor || a.preview - b.preview)) {
    const editor = Math.min(editorMax, point.editor)
    const preview = Math.min(previewMax, point.preview)
    const last = anchors[anchors.length - 1]
    if (
      editor < editorMax &&
      preview < previewMax &&
      (!last || (editor > last.editor && preview >= last.preview))
    )
      anchors.push({ editor, preview })
  }
  anchors.push({ editor: editorMax, preview: previewMax })
  return anchors
}

export type TextEdit = { start: number; end: number; text: string }

export function continueList(body: string, start: number, end: number): TextEdit | null {
  if (start !== end) return null
  const preceding = body.slice(0, start)
  // Leave fenced code indentation and Enter behavior alone.
  let fence = ''
  for (const line of preceding.split('\n')) {
    const match = line.match(/^\s*(`{3,}|~{3,})/)
    if (match && (!fence || (match[1][0] === fence[0] && match[1].length >= fence.length)))
      fence = fence ? '' : match[1]
  }
  if (fence) return null
  const lineStart = preceding.lastIndexOf('\n') + 1
  const lineEnd = body.indexOf('\n', start)
  const line = body.slice(lineStart, lineEnd < 0 ? body.length : lineEnd)
  const match = line.match(/^(\s*)(?:([-+*]) (\[[ xX]\] )?|(\d+)([.)]) |> )(.*)$/)
  if (!match || start < lineStart + line.length - match[6].length) return null
  if (!match[6].trim()) return { start: lineStart, end: start, text: '' }
  const marker = match[2]
    ? `${match[2]} ${match[3] ? '[ ] ' : ''}`
    : match[4]
      ? `${Number(match[4]) + 1}${match[5]} `
      : '> '
  return { start, end, text: `\n${match[1]}${marker}` }
}

export function indentLines(body: string, start: number, end: number, outdent: boolean): TextEdit {
  if (!outdent && start === end) return { start, end, text: '  ' }
  const from = start === 0 ? 0 : body.lastIndexOf('\n', start - 1) + 1
  const last = end > start && body[end - 1] === '\n' ? end - 1 : end
  const lineEnd = body.indexOf('\n', last)
  const to = lineEnd < 0 ? body.length : lineEnd
  return {
    start: from,
    end: to,
    text: body
      .slice(from, to)
      .split('\n')
      .map((line) => (outdent ? line.replace(/^( {1,2}|\t)/, '') : '  ' + line))
      .join('\n'),
  }
}

export function applyTextEdit(field: HTMLTextAreaElement, edit: TextEdit) {
  field.focus()
  field.setSelectionRange(edit.start, edit.end)
  // The native edit command preserves undo/redo, unlike assigning textarea.value.
  return document.execCommand('insertText', false, edit.text)
}

export function lineBoundarySelection(
  body: string,
  start: number,
  end: number,
  direction: string,
  key: 'Home' | 'End',
  extend: boolean
): [number, number, 'forward' | 'backward' | 'none'] {
  const caret = direction === 'backward' ? start : end
  const anchor = direction === 'backward' ? end : start
  const nextBreak = body.indexOf('\n', caret)
  const target =
    key === 'Home'
      ? caret === 0
        ? 0
        : body.lastIndexOf('\n', caret - 1) + 1
      : nextBreak < 0
        ? body.length
        : nextBreak
  return extend
    ? [Math.min(anchor, target), Math.max(anchor, target), target < anchor ? 'backward' : 'forward']
    : [target, target, 'none']
}

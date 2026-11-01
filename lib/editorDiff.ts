export type DiffLine = { kind: 'same' | 'added' | 'removed'; text: string }
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n'),
    b = after.split('\n')
  let head = 0,
    tail = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail++
  const old = a.slice(head, a.length - tail),
    next = b.slice(head, b.length - tail)
  const result: DiffLine[] = a.slice(0, head).map((text) => ({ kind: 'same', text }))
  // Bound memory for very large rewrites; show the entire changed middle in that case.
  if ((old.length + 1) * (next.length + 1) > 1_000_000) {
    for (const text of old) result.push({ kind: 'removed', text })
    for (const text of next) result.push({ kind: 'added', text })
  } else {
    const lengths = Array.from({ length: old.length + 1 }, () => new Uint32Array(next.length + 1))
    for (let i = old.length - 1; i >= 0; i--)
      for (let j = next.length - 1; j >= 0; j--)
        lengths[i][j] =
          old[i] === next[j]
            ? lengths[i + 1][j + 1] + 1
            : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    let i = 0,
      j = 0
    while (i < old.length || j < next.length) {
      if (i < old.length && j < next.length && old[i] === next[j]) {
        result.push({ kind: 'same', text: old[i++] })
        j++
      } else if (i < old.length && (j === next.length || lengths[i + 1][j] >= lengths[i][j + 1]))
        result.push({ kind: 'removed', text: old[i++] })
      else result.push({ kind: 'added', text: next[j++] })
    }
  }
  for (const text of a.slice(a.length - tail)) result.push({ kind: 'same', text })
  return result
}

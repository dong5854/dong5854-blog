// Literal, case-sensitive matching; replacement text is never treated as a regex template.
export function findMatches(body: string, query: string) {
  const matches: number[] = []
  if (!query) return matches
  let from = 0
  while (from <= body.length - query.length) {
    const index = body.indexOf(query, from)
    if (index < 0) break
    matches.push(index)
    from = index + query.length
  }
  return matches
}
export function scrollRatio(top: number, height: number, viewport: number) {
  return height <= viewport ? 0 : Math.max(0, Math.min(1, top / (height - viewport)))
}

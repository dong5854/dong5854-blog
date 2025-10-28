export type CoreContent<T> = Omit<T, 'body' | '_raw' | '_id'>

const isProduction = process.env.NODE_ENV === 'production'

function dateSortDesc(a: Date | string, b: Date | string) {
  if (a > b) return -1
  if (a < b) return 1
  return 0
}

export function sortPosts<T extends Record<string, unknown>>(
  documents: T[],
  dateKey: keyof T = 'date' as keyof T
): T[] {
  return [...documents].sort((a, b) =>
    dateSortDesc(a[dateKey] as Date | string, b[dateKey] as Date | string)
  )
}

function omitKeys<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  keys: readonly K[]
): Omit<T, K> {
  const cloned: Record<string, unknown> = { ...value }
  for (const key of keys) {
    delete cloned[key as string]
  }
  return cloned as Omit<T, K>
}

export function coreContent<T extends Record<string, unknown>>(document: T): CoreContent<T> {
  return omitKeys(document, ['body', '_raw', '_id'] as const)
}

export function allCoreContent<T extends { draft?: boolean }>(documents: T[]): CoreContent<T>[] {
  const mapped = documents.map((document) => coreContent(document))
  if (!isProduction) {
    return mapped
  }
  return mapped.filter((document) => !(document.draft === true))
}

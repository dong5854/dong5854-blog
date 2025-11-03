type TocItem = {
  value: string
  url: string
  depth: number
}

type TOCInlineProps = {
  toc: TocItem[]
  fromHeading?: number
  toHeading?: number
  asDisclosure?: boolean
  exclude?: string | string[]
  collapse?: boolean
  ulClassName?: string
  liClassName?: string
}

type NestedTocItem = TocItem & { children?: NestedTocItem[] }

function buildNestedList(items: TocItem[]): NestedTocItem[] {
  const nested: NestedTocItem[] = []
  const stack: NestedTocItem[] = []

  items.forEach((item) => {
    const current: NestedTocItem = { ...item }

    while (stack.length > 0 && stack[stack.length - 1].depth >= current.depth) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    if (parent) {
      parent.children = parent.children ?? []
      parent.children.push(current)
    } else {
      nested.push(current)
    }

    stack.push(current)
  })

  return nested
}

function renderList(items: NestedTocItem[], ulClassName?: string, liClassName?: string) {
  if (!items.length) return null

  return (
    <ul className={ulClassName}>
      {items.map((item) => (
        <li key={item.url} className={liClassName}>
          <a href={item.url}>{item.value}</a>
          {item.children ? renderList(item.children, ulClassName, liClassName) : null}
        </li>
      ))}
    </ul>
  )
}

export default function TOCInline({
  toc,
  fromHeading = 1,
  toHeading = 6,
  asDisclosure = false,
  exclude = '',
  collapse = false,
  ulClassName = '',
  liClassName = '',
}: TOCInlineProps) {
  const exclusions = Array.isArray(exclude) ? exclude.join('|') : exclude
  const excludeRegex = exclusions ? new RegExp(`^(${exclusions})$`, 'i') : null

  const filtered = toc.filter((heading) => {
    const withinRange = heading.depth >= fromHeading && heading.depth <= toHeading
    const excluded = excludeRegex?.test(heading.value)
    return withinRange && !excluded
  })

  const nested = buildNestedList(filtered)
  const list = renderList(nested, ulClassName, liClassName)

  if (!list) return null

  if (!asDisclosure) {
    return list
  }

  return (
    <details open={!collapse}>
      <summary className="ml-6 pb-2 pt-2 text-xl font-bold">Table of Contents</summary>
      <div className="ml-6">{list}</div>
    </details>
  )
}

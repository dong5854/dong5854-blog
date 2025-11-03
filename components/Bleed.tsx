import type { ReactNode } from 'react'

interface BleedProps {
  children: ReactNode
  full?: boolean
}

export default function Bleed({ children, full = false }: BleedProps) {
  const className = full
    ? 'relative mt-6 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)]'
    : 'relative mt-6 -mx-6 md:-mx-8 2xl:-mx-24'

  return <div className={className}>{children}</div>
}

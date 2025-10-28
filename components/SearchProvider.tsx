'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
  type Action,
} from 'kbar'
import { useRouter } from 'next/navigation'
import siteMetadata from '@/data/siteMetadata'

type SearchDocument = {
  path: string
  title: string
  summary?: string
  tags?: string[]
}

type KbarSearchConfig = {
  kbarConfig?: {
    searchDocumentsPath?: string
  }
}

const searchPath =
  ((siteMetadata.search ?? {}) as KbarSearchConfig).kbarConfig?.searchDocumentsPath ?? 'search.json'
const searchUrl = searchPath.startsWith('/') ? searchPath : `/${searchPath}`

function useSearchActions(): Action[] {
  const router = useRouter()
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadSearchIndex() {
      try {
        const res = await fetch(searchUrl)
        if (!res.ok) {
          throw new Error(`Failed to load search index: ${res.status}`)
        }
        const docs: SearchDocument[] = await res.json()
        if (cancelled) return

        const mapped = docs.map<Action>((doc) => {
          const href = doc.path.startsWith('/') ? doc.path : `/${doc.path}`
          return {
            id: doc.path,
            name: doc.title,
            section: 'Posts',
            subtitle: doc.summary,
            keywords: doc.tags?.join(' ') ?? '',
            perform: () => router.push(href),
          }
        })
        setActions(mapped)
      } catch (error) {
        console.error('Search index load failed', error)
        if (!cancelled) setActions([])
      }
    }

    loadSearchIndex()

    return () => {
      cancelled = true
    }
  }, [router])

  return useMemo(() => actions, [actions])
}

function BodyScrollLock() {
  const { visualState } = useKBar((state) => ({ visualState: state.visualState }))

  useEffect(() => {
    const shouldLock = visualState !== 'hidden'
    const original = document.body.style.overflow
    document.body.style.overflow = shouldLock ? 'hidden' : original
    return () => {
      document.body.style.overflow = original
    }
  }, [visualState])

  return null
}

function SearchResults() {
  const { results } = useMatches()

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        if (typeof item === 'string') {
          return (
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {item}
            </div>
          )
        }

        return (
          <div
            className={`rounded-lg px-4 py-3 transition ${
              active
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <div className="text-sm font-medium">{item.name}</div>
            {item.subtitle ? (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</div>
            ) : null}
          </div>
        )
      }}
    />
  )
}

function SearchOverlay() {
  const { query } = useKBar()

  return (
    <KBarPortal>
      <BodyScrollLock />
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm" />
      <KBarPositioner className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-32">
        <KBarAnimator className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700/60 dark:bg-gray-900">
          <div className="border-b border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <KBarSearch
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Search posts..."
            />
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto bg-white px-3 py-4 dark:bg-gray-900">
            <SearchResults />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200/80 bg-gray-50/80 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
            <span>Navigate</span>
            <kbd className="rounded-md border border-gray-300 px-1.5 py-0.5 text-gray-500 dark:border-gray-600 dark:text-gray-400">
              ↑↓
            </kbd>
            <span>Select</span>
            <kbd className="rounded-md border border-gray-300 px-1.5 py-0.5 text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Enter
            </kbd>
            <span>Close</span>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-1.5 py-0.5 text-gray-500 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              onClick={() => query.toggle()}
            >
              Esc
            </button>
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const actions = useSearchActions()

  return (
    <KBarProvider actions={actions} options={{ toggleShortcut: '$mod+k' }}>
      <SearchOverlay />
      {children}
    </KBarProvider>
  )
}

'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
  useRegisterActions,
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

type KbarConfig = {
  kbarConfig?: {
    searchDocumentsPath?: string
  }
}

const searchPath = ((siteMetadata.search ?? {}) as KbarConfig).kbarConfig?.searchDocumentsPath
const searchUrl =
  searchPath && searchPath.startsWith('/') ? searchPath : `/${searchPath ?? 'search.json'}`

interface SearchState {
  actions: Action[]
  isLoading: boolean
  error?: string
}

function useSearchActions(): SearchState {
  const router = useRouter()
  const [state, setState] = useState<SearchState>({ actions: [], isLoading: true })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(searchUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(`검색 인덱스 로드 실패 (status: ${res.status})`)

        const docs: SearchDocument[] = await res.json()
        if (cancelled) return

        const actions: Action[] = docs.map((doc) => {
          const rawPath = doc.path.startsWith('/') ? doc.path : `/${doc.path}`
          const encodedPath = encodeURI(rawPath)
          return {
            id: doc.path,
            name: doc.title,
            section: 'Posts',
            subtitle: doc.summary,
            keywords: doc.tags?.join(' ') ?? '',
            perform: () => router.push(encodedPath),
          }
        })

        setState({ actions, isLoading: false })
      } catch (error) {
        console.error('Search index load failed', error)
        if (!cancelled) {
          setState({ actions: [], isLoading: false, error: '검색 데이터를 불러오지 못했습니다.' })
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [router])

  return state
}

function BodyScrollLock() {
  const { visualState } = useKBar((state) => ({ visualState: state.visualState }))

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = visualState !== 'hidden' ? 'hidden' : previous
    return () => {
      document.body.style.overflow = previous
    }
  }, [visualState])

  return null
}

function SearchResults({
  isLoading,
  error,
  hasActions,
}: {
  isLoading: boolean
  error?: string
  hasActions: boolean
}) {
  const { results } = useMatches()
  const hasMatches = results.some((item) => typeof item !== 'string')

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        검색 인덱스를 불러오는 중입니다…
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 text-center text-sm text-red-500 dark:text-red-400">{error}</div>
    )
  }

  if (!hasActions) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        아직 검색할 문서가 없습니다.
      </div>
    )
  }

  if (!hasMatches) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        검색 결과가 없습니다.
      </div>
    )
  }

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

function SearchOverlay({ actions, isLoading, error }: SearchState) {
  const { query } = useKBar()
  const hasActions = actions.length > 0

  return (
    <KBarPortal>
      <BodyScrollLock />
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm" />
      <KBarPositioner className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-32">
        <KBarAnimator className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700/60 dark:bg-gray-900">
          <div className="border-b border-gray-200/80 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <KBarSearch
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              placeholder="검색어를 입력하세요…"
            />
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto bg-white px-3 py-4 dark:bg-gray-900">
            <SearchResults isLoading={isLoading} error={error} hasActions={hasActions} />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200/80 bg-gray-50/80 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
            <span>이동</span>
            <kbd className="rounded-md border border-gray-300 px-1.5 py-0.5 text-gray-500 dark:border-gray-600 dark:text-gray-400">
              ↑↓
            </kbd>
            <span>선택</span>
            <kbd className="rounded-md border border-gray-300 px-1.5 py-0.5 text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Enter
            </kbd>
            <span>닫기</span>
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

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const searchState = useSearchActions()

  return (
    <KBarProvider options={{ toggleShortcut: '$mod+k', disableScrollbarManagement: true }}>
      <SearchOverlay {...searchState} />
      <ActionRegistrar actions={searchState.actions} />
      {children}
    </KBarProvider>
  )
}

function ActionRegistrar({ actions }: { actions: Action[] }) {
  useRegisterActions(actions, [actions])
  return null
}

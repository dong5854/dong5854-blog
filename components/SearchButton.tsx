'use client'

import { useKBar } from 'kbar'

export default function SearchButton() {
  const { query } = useKBar()

  return (
    <>
      <button
        type="button"
        onClick={() => query.toggle()}
        className="hidden items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300 sm:flex"
        aria-label="Search posts"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="mr-2 h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z"
          />
        </svg>
        <span className="mr-2">검색</span>
        <span className="flex items-center gap-1 rounded-md border border-gray-200 px-1.5 py-0.5 text-xs uppercase text-gray-400 dark:border-gray-600 dark:text-gray-500">
          ⌘ K
        </span>
      </button>
      <button
        type="button"
        onClick={() => query.toggle()}
        className="flex items-center rounded-full border border-gray-200 p-2 text-gray-600 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300 sm:hidden"
        aria-label="검색 열기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z"
          />
        </svg>
      </button>
    </>
  )
}

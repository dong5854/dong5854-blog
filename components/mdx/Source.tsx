import type { PreviewPositionProps } from '@/lib/remark/previewPositions'

export default function Source({
  title,
  href,
  label = '출처',
  ...position
}: { title: string; href?: string; label?: string } & PreviewPositionProps) {
  const safe = href && /^https?:\/\//i.test(href)
  return (
    <span
      {...position}
      className="mdx-source not-prose my-2 block text-[0.8em] font-normal leading-relaxed text-gray-500 dark:text-gray-400"
    >
      {label.trim() && <span className="mr-2">{label}</span>}
      {safe ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words font-normal text-gray-600 no-underline underline-offset-4 hover:text-emerald-600 hover:underline focus-visible:underline dark:text-gray-300 dark:hover:text-emerald-400"
        >
          {title}
          <span aria-hidden="true" className="ml-1 text-[0.85em]">
            ↗
          </span>
        </a>
      ) : (
        title
      )}
    </span>
  )
}

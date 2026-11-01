import type { PreviewPositionProps } from '@/lib/remark/previewPositions'

export default function Note({
  title = '참고',
  text,
  ...position
}: { title?: string; text: string } & PreviewPositionProps) {
  return (
    <aside
      {...position}
      aria-label={title}
      className="not-prose my-5 rounded-r-xl border-l-2 border-emerald-500/40 bg-gray-50 px-4 py-3 text-[0.9em] not-italic leading-relaxed dark:bg-gray-800/40"
    >
      <p className="mb-1 mt-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="m-0 whitespace-pre-line break-words font-normal text-gray-600 dark:text-gray-300">
        {text}
      </p>
    </aside>
  )
}

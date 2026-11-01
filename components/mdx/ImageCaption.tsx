export default function ImageCaption({ text }: { text?: string }) {
  if (!text?.trim()) return null
  return (
    <span
      aria-hidden="true"
      className="not-prose mt-1.5 block text-center text-[0.8em] font-normal leading-relaxed text-gray-500 dark:text-gray-400"
    >
      {text}
    </span>
  )
}

import { createProcessor } from '@mdx-js/mdx'
import { previewOptions } from '@/lib/mdx-preview-options'
import { remarkPreviewPositions } from '@/lib/remark/previewPositions'

const options = {
  ...previewOptions,
  remarkPlugins: [...previewOptions.remarkPlugins!, remarkPreviewPositions],
}
const fast = createProcessor(options)
let highlighted: ReturnType<typeof createProcessor> | undefined
let latest = 0
let idle: ReturnType<typeof setTimeout> | undefined

self.onmessage = async (event: MessageEvent<{ id: number; body: string }>) => {
  const { id, body } = event.data
  latest = id
  clearTimeout(idle)
  try {
    const code = String(await fast.process(body))
    self.postMessage({ id, phase: 'fast', code })
    idle = setTimeout(async () => {
      try {
        if (!highlighted) {
          const { default: prism } = await import('rehype-prism-plus')
          highlighted = createProcessor({
            ...options,
            rehypePlugins: [
              ...previewOptions.rehypePlugins!,
              [prism, { defaultLanguage: 'js', ignoreMissing: true }],
            ],
          })
        }
        if (id !== latest) return
        const code = String(await highlighted.process(body))
        if (id === latest) self.postMessage({ id, phase: 'highlight', code })
      } catch {
        // Syntax highlighting is optional; keep the successful fast preview.
      }
    }, 300)
  } catch (error) {
    self.postMessage({
      id,
      phase: 'fast',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
self.postMessage({ phase: 'ready' })

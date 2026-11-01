import { createPreviewQueue } from '@/lib/previewQueue'

export function createLocalPreview(
  onResult: (code: string) => void,
  onError: (error: unknown) => void
) {
  const worker = new Worker('/api/dev/editor/preview-worker')
  let latest = 0
  let waiting: { resolve: (code: string) => void; reject: (error: Error) => void } | undefined
  let failure: Error | undefined
  let ready = false
  let queuedMessage: { id: number; body: string } | undefined
  const queue = createPreviewQueue(
    (body) =>
      new Promise<string>((resolve, reject) => {
        if (failure) {
          reject(failure)
          return
        }
        waiting = { resolve, reject }
        queuedMessage = { id: ++latest, body }
        if (ready) worker.postMessage(queuedMessage)
      }),
    onResult,
    onError
  )
  worker.onmessage = (
    event: MessageEvent<{ id: number; phase: string; code: string; error?: string }>
  ) => {
    const data = event.data
    if (data.phase === 'ready') {
      ready = true
      if (queuedMessage) worker.postMessage(queuedMessage)
      return
    }
    if (data.id !== latest) return
    if (data.phase === 'fast') {
      const pending = waiting
      waiting = undefined
      if (data.error) pending?.reject(new Error(data.error))
      else pending?.resolve(data.code)
    } else {
      onResult(data.code)
    }
  }
  worker.onerror = (event) => {
    failure = new Error(`미리보기 작업을 시작하지 못했습니다. 새로고침해 주세요. ${event.message}`)
    waiting?.reject(failure)
    waiting = undefined
    onError(failure)
  }
  return {
    submit: queue.submit,
    dispose() {
      queue.dispose()
      waiting?.reject(new Error('Preview disposed'))
      waiting = undefined
      worker.terminate()
    },
  }
}

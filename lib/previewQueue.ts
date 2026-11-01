// Compile immediately, with one request in flight and only the newest edit waiting.
export function createPreviewQueue(
  compile: (body: string, signal: AbortSignal) => Promise<string>,
  onResult: (code: string) => void,
  onError: (error: unknown) => void
) {
  let pending: string | undefined
  let running = false
  let disposed = false
  const controller = new AbortController()

  async function drain() {
    running = true
    try {
      while (!disposed && pending !== undefined) {
        const body = pending
        pending = undefined
        try {
          const code = await compile(body, controller.signal)
          if (!disposed) onResult(code)
        } catch (error) {
          if (!disposed && pending === undefined) onError(error)
        }
      }
    } finally {
      running = false
    }
  }

  return {
    submit(body: string) {
      if (disposed) return
      pending = body
      if (!running) void drain()
    },
    dispose() {
      disposed = true
      pending = undefined
      controller.abort()
    },
  }
}

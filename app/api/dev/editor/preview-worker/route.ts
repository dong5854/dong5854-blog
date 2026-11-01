import { build } from 'esbuild'
import { localDevRequest } from '@/lib/dev/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Build once per dev server module lifetime. This avoids Turbopack's DOM-only
// dependency resolution in workers and never sends article content to the server.
// The bundle also includes source positions used by the editor scroll mapping.
let bundle: Promise<string> | undefined
export async function GET(request: Request) {
  if (!localDevRequest(request.headers)) return new Response('Not found', { status: 404 })
  try {
    bundle ??= build({
      absWorkingDir: process.cwd(),
      entryPoints: ['app/dev/editor/preview.worker.ts'],
      bundle: true,
      platform: 'browser',
      conditions: ['worker'],
      format: 'iife',
      minify: true,
      write: false,
    }).then((result) => result.outputFiles[0].text)
    return new Response(await bundle, {
      headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch {
    bundle = undefined
    return new Response('Preview worker build failed', { status: 500 })
  }
}

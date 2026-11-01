'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    async function configureServiceWorker() {
      if (process.env.NODE_ENV === 'development') {
        const scriptURL = new URL('/sw.js', window.location.origin).href
        const registrations = await navigator.serviceWorker.getRegistrations()
        const controlledByBlog = navigator.serviceWorker.controller?.scriptURL === scriptURL
        await Promise.all(
          registrations
            .filter((registration) =>
              [registration.active, registration.waiting, registration.installing].some(
                (worker) => worker?.scriptURL === scriptURL
              )
            )
            .map((registration) => registration.unregister())
        )
        await caches.delete('blog-v1')
        // Unregistering alone leaves this document controlled until it navigates.
        if (controlledByBlog) window.location.reload()
        return
      }
      await navigator.serviceWorker.register('/sw.js')
    }

    configureServiceWorker().catch((err) => {
      console.error('Service worker setup failed:', err)
    })
  }, [])

  return null
}

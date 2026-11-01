export function localDevRequest(headers: Headers) {
  if (process.env.NODE_ENV !== 'development') return false
  const host = headers.get('host')
  if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false
  const origin = headers.get('origin')
  if (origin && origin !== `http://${host}` && origin !== `https://${host}`) return false
  return headers.get('sec-fetch-site') !== 'cross-site'
}

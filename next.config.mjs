import { writeFileSync, readFileSync, existsSync } from 'fs'

const isDev = process.argv.indexOf('dev') !== -1
const isBuild = process.argv.indexOf('build') !== -1
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = '1'
  const { build } = await import('velite')
  await build({ watch: isDev, clean: !isDev })

  // Generate search index after velite build
  const indexPath = '.velite/blogs.json'
  if (existsSync(indexPath)) {
    const blogs = JSON.parse(readFileSync(indexPath, 'utf8'))
    const isProduction = process.env.NODE_ENV === 'production'
    const filtered = isProduction ? blogs.filter((b) => !b.draft) : blogs
    const searchDocs = filtered
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .map(({ title, path, summary, tags }) => ({ title, path, summary, tags }))
    writeFileSync('public/search.json', JSON.stringify(searchDocs))
    console.log('Search index generated...')
  }
}

const isDevEnv = process.env.NODE_ENV === 'development'
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDevEnv ? "'unsafe-eval'" : ''} 'unsafe-inline' static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src 'self' cloudflareinsights.com;
  font-src 'self';
  frame-src 'self';
  worker-src 'self'
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig

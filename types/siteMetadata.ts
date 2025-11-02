export type SiteMetadata = {
  title: string
  author: string
  headerTitle: string
  description: string
  language: string
  theme: 'system' | 'dark' | 'light'
  siteUrl: string
  siteRepo: string
  socialBanner: string
  email: string
  github: string
  linkedin: string
  locale: string
  search: {
    kbarConfig: {
      searchDocumentsPath: string
    }
  }
}

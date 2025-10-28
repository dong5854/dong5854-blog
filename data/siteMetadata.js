/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: `dong5854's blog`,
  author: 'Dong Young Lee',
  headerTitle: `dong5854's blog`,
  description: `dong5854's 블로그`,
  language: 'ko-KR',
  theme: 'system', // system, dark or light
  siteUrl: 'https://dong5854-blog-lac-one.vercel.app/',
  siteRepo: 'https://github.com/dong5854/tech-blog',
  siteLogo: '/static/images/logo.png',
  socialBanner: '/static/images/twitter-card.png',
  mastodon: 'https://mastodon.social/@mastodonuser',
  email: 'dong5854@gmail.com',
  github: 'https://github.com/dong5854',
  twitter: 'https://twitter.com/Twitter',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
  linkedin: 'https://www.linkedin.com/in/%EB%8F%99%EC%98%81-%EC%9D%B4-a88b7b244/',
  locale: 'ko-KR',
  search: {
    provider: 'kbar', // kbar or algolia
    kbarConfig: {
      searchDocumentsPath: 'search.json', // path to load documents to search
    },
  },
}

module.exports = siteMetadata

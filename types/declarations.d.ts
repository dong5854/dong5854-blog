declare module 'github-slugger' {
  export function slug(value: string): string
  export default class GithubSlugger {
    static slug(value: string): string
    slug(value: string): string
    reset(): void
  }
}

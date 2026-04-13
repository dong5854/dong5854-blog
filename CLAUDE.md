# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server**: `yarn dev`
- **Build**: `yarn build`
- **Lint**: `yarn lint` (runs ESLint with auto-fix on app, components, lib, layouts)
- **Production server**: `yarn serve`
- **Bundle analysis**: `yarn analyze`

No test framework is configured.

## Architecture

Next.js 16 blog (App Router) using **Velite** for MDX content management and **Tailwind CSS** for styling.

### Content Pipeline

1. MDX files live in `data/blog/[category]/[post].mdx` and `data/authors/[name].mdx`
2. Velite compiles MDX at build time → outputs JSON to `.velite/` directory
3. `lib/contentlayer.ts` reads `.velite/*.json` and exports typed `allBlogs` / `allAuthors`
4. `lib/content.ts` provides helpers: `sortPosts`, `coreContent`, `allCoreContent` (filters drafts in production)
5. `next.config.mjs` auto-generates `public/search.json` from `.velite/blogs.json` on every build/dev start

Blog frontmatter fields: `title`, `date`, `tags`, `draft`, `summary`, `images`, `authors`, `layout`, `lastmod`, `canonicalUrl`, `bibliography`.

### Custom Remark/Rehype Plugins

- `lib/remark/codeTitles.ts` — parses `` ```lang:title `` syntax to render filename headers above code blocks
- `lib/remark/convertImages.ts` — converts markdown images to Next.js `<Image>` with auto-detected dimensions

### Layouts

Layout components in `layouts/` are selected per-post via the `layout` frontmatter field:
- `PostLayout` — standard blog post with author info, date, prev/next navigation
- `ListLayout` / `ListLayoutWithTags` — blog listing pages
- `AuthorLayout` — author profile pages

### Key Conventions

- Path aliases: `@/components/*`, `@/data/*`, `@/layouts/*`, `@/css/*`, `@/lib/*`
- Korean language blog (`ko-KR` locale)
- Dark mode via `next-themes` (class-based)
- Search via kbar command palette, indexed from `public/search.json`
- Prettier: no semicolons, single quotes, 100 char width, tailwindcss plugin
- Package manager: **Yarn**
- Git hooks: Husky + lint-staged (auto-lint on commit)

### Do NOT

- `.velite/` 디렉토리의 파일(`blogs.json`, `authors.json`, `index.js`, `index.d.ts`)을 직접 수정하지 않기 — Velite가 빌드 시 자동 생성
- `public/search.json`을 수동으로 편집하지 않기 — `next.config.mjs`가 빌드/dev 시작 시 `.velite/blogs.json`에서 자동 생성
- `public/sitemap.xml`, `public/feed.xml` 등 XML 파일을 수동으로 편집하지 않기 — 빌드 시 자동 생성
- `next-env.d.ts`를 수동으로 편집하지 않기 — Next.js가 자동 관리
- `yarn.lock`을 직접 수정하지 않기 — `yarn add`/`yarn remove` 명령으로만 변경
- `.next/` 디렉토리의 빌드 결과물을 수정하지 않기
- `public/static/velite/` 하위 파일을 수동으로 수정하지 않기 — Velite가 자동 생성하는 asset 디렉토리
- 패키지 설치 시 `npm` 대신 반드시 `yarn` 사용
- `next.config.mjs`의 CSP에서 `unsafe-eval`, `unsafe-inline`을 제거하지 않기:
  - `unsafe-eval`: `MDXRenderer.tsx`에서 `new Function(code)`로 Velite 컴파일된 MDX를 실행하는 데 필수
  - `unsafe-inline` (style-src): Next.js 인라인 스타일 주입 및 `next-themes` 다크모드 초기화에 필수
  - `unsafe-inline` (script-src): Cloudflare Web Analytics 연동에 필요
  - Cloudflare(`static.cloudflareinsights.com`, `cloudflareinsights.com`) 도메인 허용은 Cloudflare Web Analytics용

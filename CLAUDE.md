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

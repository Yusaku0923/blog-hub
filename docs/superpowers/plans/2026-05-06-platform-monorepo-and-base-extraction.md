# Platform Monorepo Init + blog-base Extraction (M1 + M2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the `blog-platform` pnpm monorepo at `/Users/yusaku/projects/blog-hub/` and extract a Nuxt Layer (`packages/blog-base/`) from PetGurashi so future sister sites can be templated cheaply, while leaving PetGurashi visually identical.

**Architecture:** Hybrid — monorepo for the platform code (base Layer + future hub), polyrepo for sites. PetGurashi consumes the base Layer via `extends:` (file path during dev, git URL with SHA pin for prod). Schema kernel (zod) lives in base, sites extend with `.extend()`. Theme via CSS-variable-backed Tailwind preset. Site vocabulary (categoryLabels / nav / masthead) flows through `app.config.ts`.

**Tech Stack:** pnpm 9 workspaces, Node 20, Nuxt 3.14+, `@nuxt/content` v3, `@nuxtjs/mdc`, Tailwind v3, TypeScript strict.

**Source spec:** `docs/superpowers/specs/2026-05-06-platform-architecture-design.md`

**Working directories:**
- Monorepo: `/Users/yusaku/projects/blog-hub/`
- Site to refactor: `/Users/yusaku/projects/PetGurashi/`

**Branch strategy:**
- `blog-hub` repo: work directly on `main` (fresh project, low risk)
- `PetGurashi` repo: work on `refactor/extract-base`, only merge to `main` after Task 13 (git URL switch + final verification). Cloudflare Pages auto-deploy stays on `main` so production is unaffected during refactor.

**Visual verification baseline pages (run after every PetGurashi-touching task):**
- TOP: `http://localhost:8080/`
- Article: `http://localhost:8080/dog/daily/<any existing slug>` (find one via `ls PetGurashi/content/dog/daily/`)
- Category: `http://localhost:8080/dog`
- Static: `http://localhost:8080/about`, `/privacy`, `/disclaimer`
- 404: `http://localhost:8080/no-such-path`

**Pre-execution checklist (engineer should confirm before starting):**
- [ ] PetGurashi `main` branch is clean (`git status` shows nothing)
- [ ] `pnpm dev` in PetGurashi currently works on port 8080
- [ ] `pnpm build` in PetGurashi currently succeeds
- [ ] Note one existing article path (e.g. `/dog/daily/intro`) for visual diff baseline — screenshot all 6 baseline pages BEFORE starting Task 3

---

## File Map

### NEW files in `/Users/yusaku/projects/blog-hub/`

**Monorepo root:**
- `pnpm-workspace.yaml`
- `package.json` (root, workspace orchestration)
- `.nvmrc`

**`packages/blog-base/`** (Nuxt Layer):
- `package.json`
- `nuxt.config.ts` (Layer partial: modules, image, fonts default, components, css, nitro.preset, typescript)
- `tsconfig.json`
- `content/schema.ts` (zod baseSchema)
- `composables/useStructuredData.ts` (verbatim from PetGurashi)
- `composables/useSiteConfig.ts` (new)
- `composables/useCategoryLabel.ts` (new)
- `pages/[...slug].vue` (from PetGurashi, with categoryLabels via composable)
- `layouts/default.vue` (slot-ified version)
- `components/article/ArticleCard.vue` (verbatim from PetGurashi)
- `components/content/FaqSection.vue` (verbatim)
- `components/content/ProductCard.vue` (verbatim)
- `components/content/ProductCompare.vue` (verbatim)
- `components/content/RelatedProducts.vue` (verbatim)
- `components/content/AffiliateBanner.vue` (verbatim)
- `components/home/LatestArticleGrid.vue` (new)
- `components/home/TagCloud.vue` (new)
- `assets/css/base.css` (@tailwind directives + CSS variable declarations)
- `tailwind/preset.ts` (CSS-variable-backed preset)
- `types/app-config.d.ts` (AppConfig.site type augmentation)

### MODIFIED files in `/Users/yusaku/projects/PetGurashi/`

- `nuxt.config.ts` (reduced to extends + site-specific overrides)
- `content.config.ts` (`baseSchema.extend()`)
- `tailwind.config.ts` (use base preset, content paths only)
- `assets/css/main.css` (CSS variable values only)
- `app.vue` (layout slot fillers)
- `pages/index.vue` (rebuilt with base building blocks)
- `components/layout/SiteHeader.vue` (read literals from `useSiteConfig`)
- `components/layout/SiteFooter.vue` (likely small change, verify)

### NEW files in `/Users/yusaku/projects/PetGurashi/`

- `app.config.ts` (categoryLabels / navItems / masthead)

### DELETED files in `/Users/yusaku/projects/PetGurashi/`

- `composables/useStructuredData.ts`
- `pages/[...slug].vue`
- `layouts/default.vue`
- `components/article/ArticleCard.vue`
- `components/content/FaqSection.vue`
- `components/content/ProductCard.vue`
- `components/content/ProductCompare.vue`
- `components/content/RelatedProducts.vue`
- `components/content/AffiliateBanner.vue`

---

## Notes on TDD scope

This plan is dominated by **lift-and-shift refactoring** of an existing untested codebase. PetGurashi has no test framework. Setting one up mid-refactor is out of scope (better belongs to the M4 hub plan, where new behavior gets written).

Verification per task uses:
- **Static**: `pnpm typecheck` + `pnpm build`
- **Functional**: `pnpm dev` + manual visual diff against pre-task screenshots
- **Structural**: JSON-LD `<script type="application/ld+json">` byte equivalence (use `view-source:` + diff tool when in doubt)

The few genuinely **new** pieces (`useCategoryLabel`, `useSiteConfig`, `LatestArticleGrid`, `TagCloud`) are trivial wrappers around `useAppConfig()` / `queryCollection()`. Skipping unit tests is YAGNI here. Add tests at the M4 boundary when hub introduces server-side logic.

---

## Task 1: Initialize the monorepo skeleton

**Working directory:** `/Users/yusaku/projects/blog-hub/`

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `.nvmrc`
- Modify: `.gitignore` (add monorepo-specific ignores)

- [ ] **Step 1.1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 1.2: Create root `package.json`**

```json
{
  "name": "blog-platform",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "typecheck": "pnpm -r typecheck"
  }
}
```

- [ ] **Step 1.3: Create `.nvmrc`**

```
20
```

- [ ] **Step 1.4: Update `.gitignore`** — append to the existing file:

```
# Monorepo
**/node_modules/
**/.nuxt/
**/.output/
**/dist/

# pnpm
.pnpm-store/
```

(Some of these are already in the existing `.gitignore` — that's fine, additions are idempotent. Open the file and add only the missing lines.)

- [ ] **Step 1.5: Run `pnpm install` and verify**

Run: `pnpm install` (in `/Users/yusaku/projects/blog-hub/`)
Expected: Creates `pnpm-lock.yaml` and `node_modules/`. Output ends with `Done in <Xs>`.

- [ ] **Step 1.6: Commit**

```bash
git add pnpm-workspace.yaml package.json .nvmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize pnpm monorepo skeleton

Adds pnpm-workspace.yaml, root package.json (private, packageManager
pinned to pnpm@9.12.0 to match PetGurashi), .nvmrc (Node 20), and
expanded .gitignore for monorepo build artifacts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Scaffold an empty `packages/blog-base/` Nuxt Layer

**Working directory:** `/Users/yusaku/projects/blog-hub/`

**Files:**
- Create: `packages/blog-base/package.json`
- Create: `packages/blog-base/nuxt.config.ts`
- Create: `packages/blog-base/tsconfig.json`
- Create: `packages/blog-base/.gitkeep` (placeholder so empty dirs land — replace with real files in later tasks)

- [ ] **Step 2.1: Create `packages/blog-base/package.json`**

```json
{
  "name": "@blog-platform/blog-base",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./nuxt.config.ts",
  "files": [
    "nuxt.config.ts",
    "tsconfig.json",
    "content/",
    "composables/",
    "pages/",
    "layouts/",
    "components/",
    "assets/",
    "tailwind/",
    "types/"
  ],
  "peerDependencies": {
    "@nuxt/content": "^3.13.0",
    "@nuxt/fonts": "^0.14.0",
    "@nuxt/image": "^2.0.0",
    "@nuxtjs/mdc": "^0.21.1",
    "@nuxtjs/robots": "^6.0.7",
    "@nuxtjs/sitemap": "^8.0.13",
    "@nuxtjs/tailwindcss": "^6.14.0",
    "nuxt": "^3.14.0",
    "tailwindcss": "^3"
  }
}
```

- [ ] **Step 2.2: Create `packages/blog-base/nuxt.config.ts`** — Layer partial config

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/content',
    '@nuxtjs/mdc',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/image',
  ],
  image: {
    format: ['webp'],
    provider: 'ipxStatic',
  },
  components: [
    { path: '~/components', pathPrefix: false },
  ],
  typescript: { strict: true },
  nitro: {
    preset: 'cloudflare-pages-static',
  },
})
```

- [ ] **Step 2.3: Create `packages/blog-base/tsconfig.json`**

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

(This file may or may not be useful in the layer-only context — Nuxt's `prepare` typically generates `.nuxt/tsconfig.json` in a consuming project. We add it as a marker; if `pnpm -F @blog-platform/blog-base typecheck` is ever needed standalone we'll revisit.)

- [ ] **Step 2.4: Create empty subdirectories with `.gitkeep` placeholders**

Run:
```bash
mkdir -p packages/blog-base/{content,composables,pages,layouts,components/{article,content,home},assets/css,tailwind,types}
touch packages/blog-base/{content,composables,pages,layouts,components/article,components/content,components/home,assets/css,tailwind,types}/.gitkeep
```

(These `.gitkeep` files get deleted as real files land in each directory in subsequent tasks.)

- [ ] **Step 2.5: Run `pnpm install` to register the workspace package**

Run: `pnpm install` (at monorepo root)
Expected: Output mentions `+1 packages` or similar; `node_modules/@blog-platform/blog-base` is symlinked to `packages/blog-base/`.

Verify: `ls -la node_modules/@blog-platform/blog-base` (should be a symlink).

- [ ] **Step 2.6: Commit**

```bash
git add packages/blog-base pnpm-lock.yaml
git commit -m "feat(blog-base): scaffold empty Nuxt Layer

Adds packages/blog-base/ with package.json (peerDeps mirror
PetGurashi's stack), Layer-only nuxt.config.ts (modules + nitro
preset + image + components path), and empty subdirectories for
content/composables/pages/layouts/components/assets/tailwind/types.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Connect PetGurashi to the empty blog-base (smoke test)

**Working directories:** `/Users/yusaku/projects/PetGurashi/` (modify), `/Users/yusaku/projects/blog-hub/` (no change)

**Files:**
- Modify: `PetGurashi/nuxt.config.ts:1-50`

**Goal:** Prove `extends:` works with a file-path reference to the workspace package, before any real code moves. If this fails, we resolve the layer-resolution mechanism *now* rather than after a half-done refactor.

- [ ] **Step 3.1: Take baseline screenshots in PetGurashi (NOT YET on the refactor branch)**

In PetGurashi's current `main`:

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open each baseline page in a browser, screenshot or save HTML source:
- `http://localhost:8080/`
- `http://localhost:8080/<one existing article path>` — find it via: `find content -name '*.md' -not -name 'index.md' | head -1`
- `http://localhost:8080/dog`
- `http://localhost:8080/about`
- `http://localhost:8080/privacy`
- `http://localhost:8080/disclaimer`
- `http://localhost:8080/no-such-path` (404)

Save screenshots somewhere outside the repo (e.g., `~/Desktop/petgurashi-baseline/`).

Stop the dev server (Ctrl+C).

- [ ] **Step 3.2: Create the refactor branch**

```bash
cd /Users/yusaku/projects/PetGurashi
git checkout -b refactor/extract-base
```

- [ ] **Step 3.3: Add `extends:` to PetGurashi's `nuxt.config.ts`**

Modify the top of the config object:

```ts
export default defineNuxtConfig({
  extends: ['../blog-hub/packages/blog-base'],
  compatibilityDate: '2026-04-20',
  // ... rest of existing config unchanged
})
```

- [ ] **Step 3.4: Re-run install in PetGurashi to refresh layer resolution**

```bash
pnpm install
```

Expected: `pnpm` re-resolves; no errors. (Nuxt resolves layers at runtime, but `pnpm install` ensures fresh state.)

- [ ] **Step 3.5: Verify `pnpm dev` still works**

```bash
pnpm dev
```

Expected: Dev server starts on `:8080`. No errors about layer resolution. Open `http://localhost:8080/` — TOP renders identically to baseline.

If error like "Cannot find layer at ../blog-hub/packages/blog-base": verify the relative path. From `/Users/yusaku/projects/PetGurashi/nuxt.config.ts`, `../blog-hub/packages/blog-base` resolves to `/Users/yusaku/projects/blog-hub/packages/blog-base/` — correct.

Stop dev server.

- [ ] **Step 3.6: Verify `pnpm build` (SSG) still works**

```bash
pnpm build
```

Expected: `dist/` regenerated, no new warnings/errors compared to before extends was added.

- [ ] **Step 3.7: Visual diff against baseline**

```bash
pnpm dev
```

Open all 6 baseline pages. Compare against screenshots from Step 3.1. Expected: pixel-identical (the layer is empty, so behavior is unchanged).

Stop dev server.

- [ ] **Step 3.8: Commit (in PetGurashi)**

```bash
cd /Users/yusaku/projects/PetGurashi
git add nuxt.config.ts
git commit -m "chore: extend empty blog-base layer (smoke test)

Adds extends to ../blog-hub/packages/blog-base (file path during
dev; will switch to git URL with SHA pin at end of refactor).
No behavior change — layer is empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Move `useStructuredData` to base

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/composables/useStructuredData.ts`
- Delete: `PetGurashi/composables/useStructuredData.ts`

**Verification:** Layer composables auto-import — calling `useArticleStructuredData()` in PetGurashi pages must continue to resolve.

- [ ] **Step 4.1: Read the source file**

Read `/Users/yusaku/projects/PetGurashi/composables/useStructuredData.ts` (71 lines).

- [ ] **Step 4.2: Create the file in base verbatim**

Path: `/Users/yusaku/projects/blog-hub/packages/blog-base/composables/useStructuredData.ts`

Copy the entire content of PetGurashi's `composables/useStructuredData.ts` exactly (no changes).

- [ ] **Step 4.3: Delete the placeholder `.gitkeep`**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/composables/.gitkeep
```

- [ ] **Step 4.4: Delete PetGurashi's copy**

```bash
cd /Users/yusaku/projects/PetGurashi
rm composables/useStructuredData.ts
# If composables/ is now empty, leave it — Nuxt is fine with empty dirs
```

- [ ] **Step 4.5: Verify `pnpm dev` resolves the composable from base**

In PetGurashi:
```bash
pnpm dev
```

Open an article page (e.g. `/dog/daily/<slug>`). View source. Search for `application/ld+json`. Expected: `BlogPosting` JSON-LD present, byte-identical to baseline.

Stop dev server.

- [ ] **Step 4.6: Verify build**

```bash
pnpm build
```

Expected: SSG completes without errors. `dist/` contains the article page with JSON-LD intact.

- [ ] **Step 4.7: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/composables/
git commit -m "feat(blog-base): move useStructuredData composable from PetGurashi

Verbatim copy. Provides useArticleStructuredData and
useBreadcrumbStructuredData via Nuxt Layer auto-import.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4.8: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add composables/useStructuredData.ts
git commit -m "refactor: drop useStructuredData (moved to blog-base layer)

JSON-LD generation is now provided by the base layer via
auto-imported composables. No call-site changes needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Move content schema kernel to base

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/content/schema.ts`
- Modify: `PetGurashi/content.config.ts` (whole file)

**Critical verification:** This is the first **cross-layer named import** test. If `import { baseSchema } from '@blog-platform/blog-base/content/schema'` doesn't resolve, fall back to one of the documented alternatives in this task.

- [ ] **Step 5.1: Create `blog-base/content/schema.ts`**

```ts
import { z } from '@nuxt/content'

// Always import `z` from '@nuxt/content' (re-exports its bundled zod).
// Importing from 'zod' directly picks a different instance that
// @nuxt/content's schema-vendor detection won't recognize.
//
// title/description bounds match PetGurashi's existing constraints
// (target title = 32-40 chars, description = 80-120 chars in JP).

export const baseSchema = z.object({
  title:       z.string().min(10).max(40),
  description: z.string().min(40).max(140),
  tags:        z.array(z.string()).default([]),
  date:        z.coerce.date(),
  created:     z.coerce.date(),
  listed:      z.boolean().default(true),
  toc:         z.boolean().default(true),
  draft:       z.boolean().default(false),
  pageType:    z.enum(['article', 'category']).default('article'),
  heroImage:   z.string().optional(),
})
```

- [ ] **Step 5.2: Replace `PetGurashi/content.config.ts` entirely**

```ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { baseSchema } from '@blog-platform/blog-base/content/schema'

// PetGurashi-specific schema extension: adds category/pet enums on
// top of the base kernel.
export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: baseSchema.extend({
        category: z.enum(['daily', 'outing', 'health', 'starter', 'furniture', 'compare', '100kin', 'column']),
        pet:      z.enum(['dog', 'cat', 'both']),
      }),
    }),
  },
})
```

- [ ] **Step 5.3: Run `pnpm dev` and check named import resolution**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

**Expected (success):** Dev server starts. No error about "cannot resolve module '@blog-platform/blog-base/content/schema'". TOP page renders.

**If it fails** with a module resolution error, apply the **fallback**:

Edit `PetGurashi/content.config.ts`:
```ts
// Fallback: relative path import instead of package-name resolution
import { baseSchema } from '../blog-hub/packages/blog-base/content/schema'
```

Then retry `pnpm dev`. Document the fallback choice in a commit message comment so M3+ tasks know to use the same pattern.

- [ ] **Step 5.4: Validate frontmatter parsing**

While dev server is running, open an existing article page (`/dog/daily/<slug>`). Expected: renders correctly, no zod validation errors in terminal output.

If you see zod errors about missing `category` or `pet`: a real bug in the migration — the existing article's frontmatter must have these fields. Check the article's `.md` and confirm. Should not trigger in practice since the schema is identical.

Stop dev server.

- [ ] **Step 5.5: Verify build**

```bash
pnpm build
```

Expected: All articles parse and render. SSG output in `dist/` is byte-identical structure to baseline.

- [ ] **Step 5.6: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/content/
git commit -m "feat(blog-base): add zod baseSchema kernel

Exports baseSchema with the universal frontmatter fields (title,
description, tags, date, created, listed, toc, draft, pageType,
heroImage). Site-specific fields (category, pet) extend via
.extend() in the consuming project.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5.7: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add content.config.ts
git commit -m "refactor: extend blog-base schema instead of redefining

Imports baseSchema from @blog-platform/blog-base/content/schema and
adds category/pet enums via .extend(). Resolves the schema-duality
question (init spec §7-B) by making zod the single source of truth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Tailwind preset + CSS variables refactor

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/tailwind/preset.ts`
- Create: `blog-hub/packages/blog-base/assets/css/base.css`
- Modify: `blog-hub/packages/blog-base/nuxt.config.ts` (add `css: ['~/assets/css/base.css']`)
- Modify: `PetGurashi/tailwind.config.ts` (use preset, drop colors)
- Modify: `PetGurashi/assets/css/main.css` (only CSS variable values)

**Verification:** Visual diff terracotta theme intact across all 6 baseline pages.

- [ ] **Step 6.1: Create `blog-base/tailwind/preset.ts`**

```ts
import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        paper:   'var(--color-paper)',
        ink:     'var(--color-ink)',
        muted:   'var(--color-muted)',
        line:    'var(--color-line)',
        tag:     'var(--color-tag)',
        accent:  'var(--color-accent)',
        accent2: 'var(--color-accent2)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
    },
  },
}
```

- [ ] **Step 6.2: Create `blog-base/assets/css/base.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * Token names defined here; sites override values in their own
 * assets/css/main.css. This is the contract between blog-base and
 * sites — change a name here, all sites need to update.
 */
:root {
  --color-bg:      #FFFFFF;
  --color-paper:   #FAFAFA;
  --color-ink:     #111111;
  --color-muted:   #666666;
  --color-line:    #DDDDDD;
  --color-tag:     #EEEEEE;
  --color-accent:  #444444;
  --color-accent2: #888888;

  --font-display: ui-serif, Georgia, serif;
  --font-body:    ui-sans-serif, system-ui, sans-serif;
  --font-mono:    ui-monospace, SF Mono, Menlo, monospace;
}

html, body {
  background: var(--color-bg);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 6.3: Wire `base.css` into the layer's nuxt.config**

Modify `blog-hub/packages/blog-base/nuxt.config.ts` — add a `css` line:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/content',
    '@nuxtjs/mdc',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/image',
  ],
  image: {
    format: ['webp'],
    provider: 'ipxStatic',
  },
  components: [
    { path: '~/components', pathPrefix: false },
  ],
  css: ['~/assets/css/base.css'],
  typescript: { strict: true },
  nitro: {
    preset: 'cloudflare-pages-static',
  },
})
```

- [ ] **Step 6.4: Replace `PetGurashi/tailwind.config.ts` entirely**

```ts
import type { Config } from 'tailwindcss'
import basePreset from '../blog-hub/packages/blog-base/tailwind/preset'

export default <Partial<Config>>{
  presets: [basePreset],
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './content/**/*.md',
    // Pull in base layer's components/pages/layouts so Tailwind sees their classes:
    '../blog-hub/packages/blog-base/components/**/*.{vue,ts}',
    '../blog-hub/packages/blog-base/layouts/**/*.vue',
    '../blog-hub/packages/blog-base/pages/**/*.vue',
  ],
}
```

- [ ] **Step 6.5: Replace `PetGurashi/assets/css/main.css` entirely**

```css
/*
 * PetGurashi terracotta theme — overrides base.css token values.
 * Token NAMES are owned by blog-base; values are owned here.
 */
:root {
  --color-bg:      #F5EFE4;
  --color-paper:   #FBF8F1;
  --color-ink:     #2A241F;
  --color-muted:   #6B5E52;
  --color-line:    #D9CEBC;
  --color-tag:     #E6DCC8;
  --color-accent:  #8B5E3C;
  --color-accent2: #6B7D5A;

  --font-display: "Klee One", "Noto Serif JP", serif;
  --font-body:    "Zen Maru Gothic", "Zen Kaku Gothic New", sans-serif;
  --font-mono:    ui-monospace, "SF Mono", Menlo, monospace;
}
```

(No `@tailwind` directives here — they come from `base.css` via the layer's `css:` array. The site's `main.css` is loaded *after* the layer's `base.css`, so these `:root` values override.)

- [ ] **Step 6.6: Confirm PetGurashi nuxt.config still loads `main.css`**

Open `PetGurashi/nuxt.config.ts` — verify the `css: ['~/assets/css/main.css']` line is still present (it should be from the original config). The layer adds `base.css`, the site adds `main.css` — both load.

If for some reason the line was removed in earlier tasks (it shouldn't have been), add it back.

- [ ] **Step 6.7: Verify dev**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open all 6 baseline pages. Compare colors / fonts / borders against pre-Task-6 screenshots. Expected: pixel-identical.

If something looks off (e.g. fonts revert to system, colors are wrong), most likely cause: CSS load order. Fix by ensuring `main.css` loads after `base.css`, which is the default for site-css-after-layer-css.

Stop dev server.

- [ ] **Step 6.8: Verify build**

```bash
pnpm build
```

Expected: SSG completes. The generated CSS bundle should include both base.css's token declarations and main.css's value overrides.

- [ ] **Step 6.9: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/tailwind/ packages/blog-base/assets/ packages/blog-base/nuxt.config.ts
git commit -m "feat(blog-base): add Tailwind preset and base.css token contract

Preset maps Tailwind color/font utilities to CSS variables. base.css
declares the variable names with neutral defaults. Sites override
values in their own main.css. Layer nuxt.config now wires base.css.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6.10: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add tailwind.config.ts assets/css/main.css
git commit -m "refactor: use blog-base Tailwind preset and CSS variable values only

tailwind.config.ts now imports base preset (contributes color/font
utility names backed by CSS vars). main.css drops @tailwind
directives (provided by base.css) and only sets the terracotta
palette values for the variables.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Move MDC content components to base

**Working directories:** Both repos.

**Files:**
- Create (verbatim copies): `blog-hub/packages/blog-base/components/content/{FaqSection,ProductCard,ProductCompare,RelatedProducts,AffiliateBanner}.vue`
- Delete: `PetGurashi/components/content/{FaqSection,ProductCard,ProductCompare,RelatedProducts,AffiliateBanner}.vue`

**Verification:** MDC components called from Markdown bodies (`::faq-section`, `::product-card`, `::product-compare`, `::related-products`, `::affiliate-banner`) continue to render. JSON-LD output (Product, AggregateRating, FAQPage, ItemList) byte-identical.

- [ ] **Step 7.1: Copy `FaqSection.vue` to base**

Path: `blog-hub/packages/blog-base/components/content/FaqSection.vue`
Source: `PetGurashi/components/content/FaqSection.vue` (45 lines)

Copy the entire content verbatim.

- [ ] **Step 7.2: Copy `ProductCard.vue` to base**

Path: `blog-hub/packages/blog-base/components/content/ProductCard.vue`
Source: `PetGurashi/components/content/ProductCard.vue` (75 lines)

Verbatim.

- [ ] **Step 7.3: Copy `ProductCompare.vue` to base**

Path: `blog-hub/packages/blog-base/components/content/ProductCompare.vue`
Source: `PetGurashi/components/content/ProductCompare.vue` (93 lines)

Verbatim.

- [ ] **Step 7.4: Copy `RelatedProducts.vue` to base**

Path: `blog-hub/packages/blog-base/components/content/RelatedProducts.vue`
Source: `PetGurashi/components/content/RelatedProducts.vue` (35 lines)

Verbatim.

- [ ] **Step 7.5: Copy `AffiliateBanner.vue` to base**

Path: `blog-hub/packages/blog-base/components/content/AffiliateBanner.vue`
Source: `PetGurashi/components/content/AffiliateBanner.vue` (76 lines)

Verbatim.

- [ ] **Step 7.6: Delete the `.gitkeep` placeholder**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/components/content/.gitkeep
```

- [ ] **Step 7.7: Delete PetGurashi's copies**

```bash
cd /Users/yusaku/projects/PetGurashi
rm components/content/FaqSection.vue
rm components/content/ProductCard.vue
rm components/content/ProductCompare.vue
rm components/content/RelatedProducts.vue
rm components/content/AffiliateBanner.vue
# Directory may now be empty — that's fine
```

- [ ] **Step 7.8: Verify dev — find articles using each MDC component**

```bash
cd /Users/yusaku/projects/PetGurashi
grep -rl '::faq-section'      content/ | head -1
grep -rl '::product-card'     content/ | head -1
grep -rl '::product-compare'  content/ | head -1
grep -rl '::related-products' content/ | head -1
grep -rl '::affiliate-banner' content/ | head -1
```

For each result (skip any that return nothing — that component just isn't used yet):

```bash
pnpm dev
```

Open the article URL. Verify:
1. Component renders (no broken Markdown)
2. View source: JSON-LD `<script type="application/ld+json">` blocks present, byte-identical to baseline (for ProductCard / ProductCompare / FaqSection at minimum)
3. Affiliate links carry `rel="sponsored nofollow noopener"` (inspect link in DevTools)

Stop dev server.

- [ ] **Step 7.9: Verify build**

```bash
pnpm build
```

Expected: All MDC-using articles render in SSG output without errors.

- [ ] **Step 7.10: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/components/content/
git commit -m "feat(blog-base): move MDC content components from PetGurashi

Verbatim copies of FaqSection, ProductCard, ProductCompare,
RelatedProducts, AffiliateBanner. All 5 are affiliate-aware
(per A decision in spec §0). Theme tokens (bg-paper, text-accent,
border-line, etc.) work via the CSS-variable Tailwind preset.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7.11: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add components/content/
git commit -m "refactor: drop MDC content components (moved to blog-base)

5 components removed: FaqSection, ProductCard, ProductCompare,
RelatedProducts, AffiliateBanner. All call sites in content/**/*.md
continue to work via Nuxt Layer auto-import.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Move `ArticleCard` to base

**Working directories:** Both repos.

**Files:**
- Create (verbatim): `blog-hub/packages/blog-base/components/article/ArticleCard.vue`
- Delete: `PetGurashi/components/article/ArticleCard.vue`

- [ ] **Step 8.1: Copy `ArticleCard.vue` to base**

Path: `blog-hub/packages/blog-base/components/article/ArticleCard.vue`
Source: `PetGurashi/components/article/ArticleCard.vue` (46 lines)

Verbatim.

- [ ] **Step 8.2: Delete `.gitkeep` and PetGurashi copy**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/components/article/.gitkeep

cd /Users/yusaku/projects/PetGurashi
rm components/article/ArticleCard.vue
```

- [ ] **Step 8.3: Verify dev — category pages use ArticleCard**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open `/dog` (a category page). Expected: card grid renders identically to baseline.

Stop dev server.

- [ ] **Step 8.4: Verify build**

```bash
pnpm build
```

- [ ] **Step 8.5: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/components/article/
git commit -m "feat(blog-base): move ArticleCard component from PetGurashi

Verbatim copy. Used by category listing pages.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 8.6: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add components/article/
git commit -m "refactor: drop ArticleCard (moved to blog-base)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Add site-config composables and types to base

**Working directory:** `/Users/yusaku/projects/blog-hub/`

**Files:**
- Create: `packages/blog-base/composables/useSiteConfig.ts`
- Create: `packages/blog-base/composables/useCategoryLabel.ts`
- Create: `packages/blog-base/types/app-config.d.ts`

**Goal:** Provide the API that Tasks 10 and 11 will consume. `app.config.ts` does not exist in PetGurashi yet — Task 10 creates it.

- [ ] **Step 9.1: Create `useSiteConfig.ts`**

Path: `packages/blog-base/composables/useSiteConfig.ts`

```ts
import type { SiteConfig } from '../types/app-config'

export const useSiteConfig = (): SiteConfig => {
  const appConfig = useAppConfig()
  return (appConfig.site ?? {}) as SiteConfig
}
```

- [ ] **Step 9.2: Create `useCategoryLabel.ts`**

Path: `packages/blog-base/composables/useCategoryLabel.ts`

```ts
export const useCategoryLabel = (key: string): string => {
  const site = useSiteConfig()
  return site.categoryLabels?.[key] ?? key
}
```

- [ ] **Step 9.3: Create `types/app-config.d.ts`**

Path: `packages/blog-base/types/app-config.d.ts`

```ts
export interface NavItem {
  label: string
  to: string
}

export interface Masthead {
  tagline?: string
  subtitle?: string
  volumeBanner?: string
  volumeStartYear?: number
}

export interface SiteConfig {
  categoryLabels?: Record<string, string>
  navItems?: NavItem[]
  masthead?: Masthead
}

declare module '@nuxt/schema' {
  interface AppConfigInput {
    site?: SiteConfig
  }
  interface AppConfig {
    site?: SiteConfig
  }
}

export {}
```

- [ ] **Step 9.4: Delete `.gitkeep` placeholders**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/types/.gitkeep 2>/dev/null || true
# composables/.gitkeep already removed in Task 4
```

- [ ] **Step 9.5: Verify the layer still parses (PetGurashi build)**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Expected: Dev server starts. No type errors. (We added composables that aren't called yet — they shouldn't break anything.)

Stop dev server.

- [ ] **Step 9.6: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/composables/useSiteConfig.ts packages/blog-base/composables/useCategoryLabel.ts packages/blog-base/types/
git commit -m "feat(blog-base): add useSiteConfig + useCategoryLabel + AppConfig types

Provides the composable surface for site-specific vocabulary
injection (category labels, nav items, masthead). Site projects
populate via app.config.ts; type augmentation via 'declare module
\"@nuxt/schema\"' makes useAppConfig().site type-safe.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Create `app.config.ts` in PetGurashi and refactor Header/Footer to read from it

**Working directory:** `/Users/yusaku/projects/PetGurashi/`

**Files:**
- Create: `app.config.ts`
- Modify: `components/layout/SiteHeader.vue` (read masthead/nav from useSiteConfig)
- Modify: `components/layout/SiteFooter.vue` (verify — may not need changes)

- [ ] **Step 10.1: Create `app.config.ts`**

```ts
export default defineAppConfig({
  site: {
    categoryLabels: {
      daily:    '毎日の暮らし',
      outing:   'お出かけ',
      health:   '健康・介護',
      starter:  'はじめて飼う',
      furniture: '猫家具',
      compare:  '比較',
      '100kin': '100均',
      column:   'コラム',
    },
    navItems: [
      { label: 'HOME',  to: '/' },
      { label: '犬',    to: '/dog' },
      { label: '猫',    to: '/cat' },
      { label: '比較',  to: '/compare' },
      { label: '100均', to: '/100kin' },
      { label: 'ABOUT', to: '/about' },
    ],
    masthead: {
      tagline:         '— A JOURNAL FOR PET LOVERS —',
      subtitle:        'ペットと暮らす、大人のための雑誌',
      volumeBanner:    'EST. 2026 — MIDDLE-LIFE PET LIVING JOURNAL',
      volumeStartYear: 2026,
    },
  },
})
```

- [ ] **Step 10.2: Read current `SiteHeader.vue`**

Read `PetGurashi/components/layout/SiteHeader.vue` (48 lines) — note hardcoded literals: tagline, volume banner, subtitle, nav array.

- [ ] **Step 10.3: Replace `SiteHeader.vue` to read from useSiteConfig**

```vue
<template>
  <div class="border-b border-line">
    <!-- Volume bar -->
    <div class="flex justify-between px-10 py-2.5 text-[11px] tracking-widest text-muted">
      <span>{{ masthead.volumeBanner }}</span>
      <span>{{ volumeLabel }}</span>
    </div>
  </div>

  <!-- Masthead -->
  <header class="border-b border-line text-center px-10 pt-8 pb-5">
    <div class="text-[11px] tracking-[3px] text-muted mb-2">{{ masthead.tagline }}</div>
    <NuxtLink to="/" class="inline-block font-display text-[56px] leading-none tracking-[-1px] text-ink">
      Pet<span class="italic text-accent">Gurashi</span>
    </NuxtLink>
    <div class="text-[12px] text-muted mt-2.5 tracking-[2px]">{{ masthead.subtitle }}</div>
  </header>

  <!-- Nav -->
  <nav class="flex justify-center gap-9 border-b-2 border-ink py-3.5 text-[13px] tracking-[1px]">
    <NuxtLink
      v-for="item in nav"
      :key="item.label"
      :to="item.to"
      class="text-ink hover:text-accent"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const site = useSiteConfig()
const masthead = computed(() => site.masthead ?? {})
const nav = computed(() => site.navItems ?? [])

const volumeLabel = computed(() => {
  const startYear = site.masthead?.volumeStartYear ?? new Date().getFullYear()
  const d = new Date()
  const month = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]
  const vol = (d.getFullYear() - startYear) * 12 + (d.getMonth() + 1)
  return `VOL.${vol} · ${month} ${d.getFullYear()}`
})
</script>
```

(The "PetGurashi" wordmark itself stays hardcoded — it's the brand identity, not config. Only the surrounding marketing copy moves to app.config.)

- [ ] **Step 10.4: Read and review `SiteFooter.vue`**

Read `PetGurashi/components/layout/SiteFooter.vue` (14 lines). If it contains hardcoded copyright / nav / contact text, refactor any that overlaps with `app.config.ts.site.masthead` or `navItems`. If it's pure brand text (e.g. just "© ペットぐらし"), leave it alone.

(Decision callout: if SiteFooter only has `© ペットぐらし` style content, no edit needed. The plan does not assume what's in SiteFooter — make the call based on the actual file content.)

- [ ] **Step 10.5: Verify dev**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open all 6 baseline pages. Pay specific attention to the Header — verify the volume banner, tagline, subtitle, and nav links render identically to baseline.

Check the volume number: with `volumeStartYear: 2026` and current date 2026-05-06, expect `VOL.5 · MAY 2026` (5 = (2026-2026)*12 + 5).

Stop dev server.

- [ ] **Step 10.6: Verify build**

```bash
pnpm build
```

- [ ] **Step 10.7: Commit (PetGurashi only — no blog-hub changes in this task)**

```bash
cd /Users/yusaku/projects/PetGurashi
git add app.config.ts components/layout/SiteHeader.vue
# Add SiteFooter.vue too if it was changed in Step 10.4
git commit -m "refactor: move site vocabulary to app.config.ts

categoryLabels, navItems, and masthead literals previously
hardcoded in SiteHeader (and rendering code) now flow through
useAppConfig().site via the base layer's useSiteConfig composable.
Brand wordmark stays in the component (identity, not vocabulary).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Move `[...slug].vue` to base, using `useCategoryLabel`

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/pages/[...slug].vue`
- Delete: `PetGurashi/pages/[...slug].vue`

**Critical:** This is the highest-risk single move (152 lines, drives all article + category rendering). Before executing, the engineer should re-screenshot baseline pages and be ready to revert.

- [ ] **Step 11.1: Re-take fresh screenshots of baseline pages**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Re-screenshot `/`, an article page, `/dog`, and `/no-such-path`. Save to `~/Desktop/petgurashi-pre-task11/`. (Static `/about` etc. don't go through `[...slug].vue` so they're unaffected.)

Stop dev server.

- [ ] **Step 11.2: Read source `[...slug].vue`**

Read `PetGurashi/pages/[...slug].vue` (152 lines) — note the inline `categoryLabels: Record<string, string>` map at lines 70-79.

- [ ] **Step 11.3: Create `blog-base/pages/[...slug].vue`**

Path: `blog-hub/packages/blog-base/pages/[...slug].vue`

Copy the source verbatim, **with these surgical changes**:

1. Remove the entire `categoryLabels` object literal (currently lines 70-79).
2. Wherever the template uses `(categoryLabels[doc.category] ?? doc.category)` or `(categoryLabels[a.category] ?? a.category)`, replace with `useCategoryLabel(doc.category)` / `useCategoryLabel(a.category)`. (`useCategoryLabel` is auto-imported from the layer's composables.)

Concretely, the lines to change:
- Old (template): `FEATURE · {{ (categoryLabels[doc.category] ?? doc.category).toUpperCase() }}`
- New: `FEATURE · {{ useCategoryLabel(doc.category).toUpperCase() }}`

- Old (template): `:category-label="(categoryLabels[a.category] ?? a.category).toUpperCase()"`
- New: `:category-label="useCategoryLabel(a.category).toUpperCase()"`

Everything else (script setup, useAsyncData, useSeoMeta, structured data calls, breadcrumb building, template structure) stays identical to the source.

- [ ] **Step 11.4: Delete `.gitkeep` and PetGurashi's copy**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/pages/.gitkeep

cd /Users/yusaku/projects/PetGurashi
rm pages/[...slug].vue
```

- [ ] **Step 11.5: Verify dev — full baseline sweep**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open and compare against Step 11.1 screenshots:
1. TOP `/` — should be unchanged (uses `pages/index.vue`, not `[...slug].vue`)
2. Article `/dog/daily/<slug>` — verify category label "DAILY" or "毎日の暮らし" displays correctly via `useCategoryLabel('daily')`. Verify breadcrumb, hero image, body, tags, JSON-LD all intact.
3. Category `/dog` — verify the children grid renders, card category labels translated correctly via `useCategoryLabel`.
4. 404 `/no-such-path` — should still 404.

Use DevTools to inspect:
- `<script type="application/ld+json">` for `BlogPosting` and `BreadcrumbList` — byte equivalence to baseline
- `<title>`, `<meta name="description">`, `<meta property="og:*">` — all populated identically

Stop dev server.

- [ ] **Step 11.6: Verify build**

```bash
pnpm build
```

Expected: SSG of all articles + categories succeeds.

- [ ] **Step 11.7: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/pages/
git commit -m "feat(blog-base): move catch-all [...slug] page from PetGurashi

Generic article + category renderer. categoryLabels map removed
from page-level state and accessed via useCategoryLabel composable
(reads useAppConfig().site.categoryLabels). All other behavior
(SEO meta, structured data, breadcrumb, listing query) unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11.8: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add pages/[...slug].vue
git commit -m "refactor: drop [...slug] (moved to blog-base, label via composable)

Catch-all article/category page now provided by the base layer.
Category labels resolved via useCategoryLabel against the
app.config.ts entries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Slot-ify the default layout

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/layouts/default.vue`
- Delete: `PetGurashi/layouts/default.vue`
- Modify: `PetGurashi/app.vue` (fill the slots)

**Verification:** Header / Footer / BottomNav / MobileMenu render in the same DOM positions as before.

- [ ] **Step 12.1: Read source `default.vue` and `app.vue`**

Read `PetGurashi/layouts/default.vue` (19 lines) and `PetGurashi/app.vue` (5 lines).

Current `app.vue`:
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Current `default.vue`:
```vue
<script setup lang="ts">
const siteUrl = useRuntimeConfig().public.siteUrl as string
useSeoMeta({
  ogImage: `${siteUrl}/og-default.png`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-body flex flex-col pb-16 md:pb-0">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <BottomNav />
    <MobileMenu />
  </div>
</template>
```

- [ ] **Step 12.2: Create `blog-base/layouts/default.vue`** — slot-only shell

```vue
<script setup lang="ts">
const siteUrl = useRuntimeConfig().public.siteUrl as string
useSeoMeta({
  ogImage: `${siteUrl}/og-default.png`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-body flex flex-col pb-16 md:pb-0">
    <slot name="header" />
    <main class="flex-1"><slot /></main>
    <slot name="footer" />
    <slot name="mobile" />
  </div>
</template>
```

- [ ] **Step 12.3: Replace `PetGurashi/app.vue`** — fill the slots

```vue
<template>
  <NuxtLayout>
    <template #header>
      <SiteHeader />
    </template>
    <template #footer>
      <SiteFooter />
    </template>
    <template #mobile>
      <BottomNav />
      <MobileMenu />
    </template>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 12.4: Delete `.gitkeep` and PetGurashi's `default.vue`**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/layouts/.gitkeep

cd /Users/yusaku/projects/PetGurashi
rm layouts/default.vue
```

(The `og-default.png` SEO meta logic that was in PetGurashi's `default.vue` is now provided by the base layer's `default.vue`. Since both rely on `useRuntimeConfig().public.siteUrl` which PetGurashi sets, this works without further change.)

- [ ] **Step 12.5: Verify dev — Header/Footer/Mobile positions**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Visually verify:
- TOP `/`: header at top, footer at bottom, BottomNav fixed bottom (mobile viewport), MobileMenu hidden initially
- Article page: same layout chrome
- `/about`: same chrome
- 404 `/no-such-path`: still inherits the layout chrome

In DevTools, check `<meta property="og:image">` is present pointing to `<siteUrl>/og-default.png`.

Stop dev server.

- [ ] **Step 12.6: Verify build**

```bash
pnpm build
```

- [ ] **Step 12.7: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/layouts/
git commit -m "feat(blog-base): add slot-based default layout

Shell only — header/footer/mobile are named slots, body is the
default slot. Sites fill the slots in their own app.vue. Default
OGP meta tag (og:image, twitter:card) carries from PetGurashi's
old default.vue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 12.8: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add app.vue layouts/default.vue
git commit -m "refactor: drop layouts/default.vue (moved to blog-base), fill slots in app.vue

Layout shell now provided by the base layer. PetGurashi's app.vue
fills #header/#footer/#mobile slots with the site's specific
SiteHeader, SiteFooter, BottomNav, and MobileMenu components.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Build LatestArticleGrid + TagCloud, rebuild PetGurashi `index.vue`

**Working directories:** Both repos.

**Files:**
- Create: `blog-hub/packages/blog-base/components/home/LatestArticleGrid.vue`
- Create: `blog-hub/packages/blog-base/components/home/TagCloud.vue`
- Modify: `PetGurashi/pages/index.vue` (full rewrite using base components for grid + tags, keeping site-specific hero)

**Verification:** TOP page visually matches baseline — same hero, same grid count, same tag set.

- [ ] **Step 13.1: Read source `PetGurashi/pages/index.vue`**

Read all 129 lines. Identify three regions:
1. **Hero / brand intro** at top — site-specific, copy verbatim into the new `index.vue`
2. **Latest articles grid** — replace with `<LatestArticleGrid :limit="6" />` (or whatever count the original showed)
3. **Tag browser** — replace with `<TagCloud />`

Note the exact `queryCollection` query the source uses for the grid (filters: pageType=article, listed=true, draft=false; order: date DESC; limit: count). The new component must match.

Note how tags are aggregated in the source (likely a flat `Set` from all article frontmatters).

- [ ] **Step 13.2: Create `blog-base/components/home/LatestArticleGrid.vue`**

Path: `blog-hub/packages/blog-base/components/home/LatestArticleGrid.vue`

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  limit?: number
  category?: string
}>(), {
  limit: 6,
})

const { data: articles } = await useAsyncData(
  `latest-articles-${props.category ?? 'all'}-${props.limit}`,
  () => {
    let q = queryCollection('content')
      .where('pageType', '=', 'article')
      .where('listed', '=', true)
      .where('draft', '=', false)
    if (props.category) q = q.where('category', '=', props.category)
    return q.order('date', 'DESC').limit(props.limit).all()
  },
)

function fmt(d: Date | string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <section class="px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-9">
    <ArticleCard
      v-for="a in articles"
      :key="a.path"
      :to="a.path"
      :title="a.title"
      :excerpt="a.description"
      :category-label="useCategoryLabel(a.category).toUpperCase()"
      author="編集部"
      :date="fmt(a.date)"
      :image="a.heroImage"
    />
  </section>
</template>
```

(The grid layout matches the category-page grid in `[...slug].vue` for consistency. If the original `pages/index.vue` used a different layout — e.g., one large featured + 5 small — adapt the template accordingly. The component contract: render `limit` latest articles, optionally filtered by category.)

- [ ] **Step 13.3: Create `blog-base/components/home/TagCloud.vue`**

Path: `blog-hub/packages/blog-base/components/home/TagCloud.vue`

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  limit?: number
}>(), {
  limit: 50,
})

const { data: tags } = await useAsyncData('all-tags', async () => {
  const articles = await queryCollection('content')
    .where('pageType', '=', 'article')
    .where('listed', '=', true)
    .where('draft', '=', false)
    .all()
  const counts = new Map<string, number>()
  for (const a of articles) {
    for (const t of a.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, props.limit)
    .map(([tag, count]) => ({ tag, count }))
})
</script>

<template>
  <section class="px-10 py-10">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink
        v-for="t in tags"
        :key="t.tag"
        :to="`/tag/${encodeURIComponent(t.tag)}`"
        class="px-3.5 py-1.5 border border-line text-[11px] bg-paper hover:bg-tag"
      >
        #{{ t.tag }}
        <span class="text-muted ml-1">{{ t.count }}</span>
      </NuxtLink>
    </div>
  </section>
</template>
```

(Note: this links to `/tag/<name>`, which doesn't have a page handler yet in PetGurashi. If the original `index.vue` rendered tags as plain spans without links, change `<NuxtLink>` to `<span>` to match. Verify after — this should match baseline behavior.)

- [ ] **Step 13.4: Delete the home `.gitkeep`**

```bash
cd /Users/yusaku/projects/blog-hub
rm packages/blog-base/components/home/.gitkeep
```

- [ ] **Step 13.5: Rewrite `PetGurashi/pages/index.vue`**

Open the source. Keep the hero/intro section verbatim. Replace the grid section with `<LatestArticleGrid :limit="N" />` (use the same N as before). Replace the tag browser section with `<TagCloud />`.

Skeleton (adjust to match the actual hero in the source):

```vue
<script setup lang="ts">
// Site-specific TOP page meta
useSeoMeta({
  title: 'ペットぐらし',
  description: 'ペットと暮らす、大人のための雑誌',
  ogTitle: 'ペットぐらし',
  ogDescription: 'ペットと暮らす、大人のための雑誌',
})
</script>

<template>
  <!-- Hero / brand intro: copy verbatim from the source's existing hero block -->
  <!-- ... (insert the original hero markup here) ... -->

  <!-- Latest articles -->
  <LatestArticleGrid :limit="6" />

  <!-- Tag browser -->
  <TagCloud />
</template>
```

The exact hero markup must come from the original source — do not invent it. The point of this task is to preserve the visual identity of the TOP while delegating the grid + tag logic to base.

- [ ] **Step 13.6: Verify dev — TOP page visual diff**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev
```

Open `/`. Compare against pre-Task-13 screenshot:
- Hero region: pixel-identical
- Grid: same number of cards, same articles in same order, same card styling
- Tag browser: same tags, same counts (if shown), same layout

If grid count or article order differs: adjust `:limit` prop. If tag rendering differs: adjust `TagCloud.vue` template (e.g., remove the link wrapper if originals were plain spans, remove count if not shown).

Stop dev server.

- [ ] **Step 13.7: Verify build**

```bash
pnpm build
```

Expected: SSG of TOP succeeds. `dist/index.html` contains the same article links and tag set as before.

- [ ] **Step 13.8: Commit blog-hub**

```bash
cd /Users/yusaku/projects/blog-hub
git add packages/blog-base/components/home/
git commit -m "feat(blog-base): add LatestArticleGrid and TagCloud home building blocks

Generic, queryCollection-backed components for site TOP pages.
LatestArticleGrid takes limit + optional category filter; TagCloud
aggregates tags across all listed/published articles. Sites compose
these in their own pages/index.vue alongside site-specific hero.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 13.9: Commit PetGurashi**

```bash
cd /Users/yusaku/projects/PetGurashi
git add pages/index.vue
git commit -m "refactor: rebuild TOP using blog-base building blocks

Hero/brand region unchanged (site-specific identity). Latest
articles grid and tag browser now delegate to LatestArticleGrid
and TagCloud from the base layer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Switch PetGurashi extends from file path to git URL with SHA pin, then merge

**Working directories:** Both repos. Network access required (push to GitHub).

**Files:**
- Modify: `PetGurashi/nuxt.config.ts:2` (the `extends:` line)

**Goal:** Production-ready extends. After this task, PetGurashi can be deployed via Cloudflare Pages because the layer reference resolves over HTTPS, not a relative file path.

- [ ] **Step 14.1: Push blog-hub `main` to origin**

```bash
cd /Users/yusaku/projects/blog-hub
git status   # confirm clean working tree
git log --oneline -10   # confirm all blog-base commits are present
git push origin main
```

- [ ] **Step 14.2: Capture the current SHA**

```bash
cd /Users/yusaku/projects/blog-hub
git rev-parse HEAD
```

Copy the full 40-char SHA. Call it `BASE_SHA` for the next step.

- [ ] **Step 14.3: Update `PetGurashi/nuxt.config.ts` extends**

Modify line 2:

```ts
// Before (file path, dev-only):
//   extends: ['../blog-hub/packages/blog-base'],
// After (git URL with SHA pin, prod-capable):
extends: ['github:Yusaku0923/blog-hub/packages/blog-base#<BASE_SHA>'],
```

Replace `<BASE_SHA>` with the actual SHA from Step 14.2.

(If a future engineer prefers to keep file-path extends for local iteration: introduce an env-flag swap. Out of scope for this plan — the simplest cut is one mode at a time. The repo will iterate via PR-cycle from here.)

- [ ] **Step 14.4: Re-install in PetGurashi to fetch the layer from GitHub**

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm install
```

Expected: pnpm/Nuxt clones blog-hub into a cache directory (typically `node_modules/.cache/nuxt/extends/<hash>/`). No errors.

- [ ] **Step 14.5: Verify dev with git URL extends**

```bash
pnpm dev
```

Open all 6 baseline pages. Expected: still pixel-identical to original baseline. (We've only changed *where* the layer comes from, not its content.)

Stop dev server.

- [ ] **Step 14.6: Verify build with git URL extends**

```bash
pnpm build
```

Expected: SSG completes. `dist/` ready for Cloudflare Pages.

- [ ] **Step 14.7: Commit (PetGurashi)**

```bash
cd /Users/yusaku/projects/PetGurashi
git add nuxt.config.ts
git commit -m "chore: pin blog-base extends to GitHub SHA for prod deploys

Switches from file-path extends (dev-only) to a SHA-pinned git URL
that Cloudflare Pages can resolve at build time. SHA: <BASE_SHA>.

Future base-layer updates: bump SHA in this file, manually for now.
Renovate/Dependabot automation deferred until 2+ sites consume the
layer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

(In the actual commit message, write the real SHA, not `<BASE_SHA>`.)

- [ ] **Step 14.8: Open PR for PetGurashi `refactor/extract-base` → `main`**

```bash
cd /Users/yusaku/projects/PetGurashi
git push -u origin refactor/extract-base
gh pr create --base main --head refactor/extract-base \
  --title "Extract blog-base layer (M1+M2)" \
  --body "$(cat <<'EOF'
## Summary
- Connects PetGurashi to the new \`blog-platform\` monorepo's \`blog-base\` Nuxt Layer (extracted as a separate refactor across 14 tasks).
- Site-visible behavior unchanged — all rendering, SEO, JSON-LD, theme are identical to pre-refactor.
- Site repo now contains only site-specific code: TOP hero, Header/Footer (reading literals from app.config.ts), static pages (about/privacy/disclaimer), \`content/\`, and theme values.

## Test plan
- [ ] CI build green
- [ ] Cloudflare Pages preview deploy renders TOP, an article page, a category page, /about, /privacy, /disclaimer, and 404 identically to production
- [ ] JSON-LD on an article page is byte-equivalent to production
- [ ] No regressions in Cloudflare Pages build logs

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

(If `gh` is not authenticated, run `gh auth login` first or have the user authenticate.)

- [ ] **Step 14.9: Wait for Cloudflare Pages preview, verify, then merge**

Once the CF Pages preview URL is up:

1. Open all 6 baseline pages on the preview URL.
2. Compare visually + DOM-inspect against production (`pet-gurashi.com`).
3. If any divergence: do **NOT** merge — file an issue, debug, push fixes to the same branch.
4. If all green: merge the PR (squash or merge commit per repo convention).

```bash
gh pr merge refactor/extract-base --squash
```

Cloudflare Pages will auto-deploy the merged main to production. Verify production once more after deploy completes.

---

## Self-Review

### 1. Spec coverage check

Walking through `docs/superpowers/specs/2026-05-06-platform-architecture-design.md`:

- §1 architecture (monorepo + per-site) → Tasks 1, 2, 3, 14 ✅
- §2.1 Tailwind preset + CSS vars → Task 6 ✅
- §2.2 schema.ts with baseSchema → Task 5 ✅
- §2.3 layout slot-ification → Task 12 ✅
- §3.1 PetGurashi shape (refactor target) → Tasks 3-13 cumulatively ✅
- §3.2 PetGurashi nuxt.config.ts target form → Tasks 3 (extends), 14 (final form) ✅
- §3.3 app.config.ts → Task 10 ✅
- §6.1 M2 ten-step breakdown → Tasks 3-13 (re-ordered with Task 10 before Task 11 to ensure categoryLabels resolve at the moment [...slug].vue moves) ✅
- §10 risk: layer cross-package named import → Task 5 Step 5.3 explicitly tests + has fallback ✅
- §10 risk: PetGurashi visual regression → screenshots in Step 3.1 + 11.1, visual checks in every PetGurashi-touching task ✅

NOT in this plan (deferred to later plans):
- §4 hub MVP (separate plan)
- §3.4 blog-site-template repo (separate plan, M3)
- §8 open questions A-F (CMS PoC = M5, image storage decision = M5, Renovate automation = post-M5)

### 2. Placeholder scan

Scanning for the patterns from "No Placeholders":
- "TBD" / "TODO" / "implement later" — not present ✅
- "Add appropriate error handling" / "handle edge cases" — not present (we explicitly skip TDD for the lift-and-shift, called out in the TDD section header) ✅
- "Write tests for the above" — addressed by the TDD scope note at the top ✅
- "Similar to Task N" — not used; each component move re-states the source path and verbatim instruction ✅

One legitimate placeholder remains: `<BASE_SHA>` in Task 14 — this is a value the executing engineer captures at runtime, not a spec gap. Explicitly documented in Step 14.2 as a fill-at-execution variable.

### 3. Type / signature consistency

- `useStructuredData`: function signatures `useArticleStructuredData(article)` / `useBreadcrumbStructuredData(items)` — matches PetGurashi source (Task 4 is verbatim copy) ✅
- `baseSchema`: zod object exported by name from `@blog-platform/blog-base/content/schema` — referenced by name in Task 5 imports ✅
- `useSiteConfig()`: returns `SiteConfig` defined in `types/app-config.d.ts` — matches usage in Task 10's SiteHeader ✅
- `useCategoryLabel(key: string): string` — signature consistent across Task 9 (definition), Task 11 (usage in [...slug].vue), Task 13 (usage in LatestArticleGrid) ✅
- `LatestArticleGrid` props: `limit?: number, category?: string` — defined in Task 13.2, used in Task 13.5 ✅
- `TagCloud` props: `limit?: number` — defined in Task 13.3, used in Task 13.5 ✅
- Layout slot names: `header`, `footer`, `mobile` — defined in Task 12.2, filled in Task 12.3 ✅

### 4. Ordering risk

Re-checked the spec's M2 step 7 (originally `[...slug].vue` before `app.config.ts`). The plan **deliberately reorders** so app.config.ts is created (Task 10) *before* `[...slug].vue` moves (Task 11) — this avoids a state where the new composable returns raw enum keys ("daily") instead of Japanese labels at build time. Called out at the top of Task 9.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-06-platform-monorepo-and-base-extraction.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

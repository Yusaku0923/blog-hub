# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status (2026-05-07)

This repo is the `blog-platform` monorepo. PetGurashi is the only current site, with future sister sites templated from it.

**Done:**
- **M1 + M2** — pnpm monorepo + `packages/blog-base/` Nuxt Layer extracted from PetGurashi. PetGurashi consumes via SHA-pinned git URL extends; production at pet-gurashi.com is running on the new layer.
- **M5 (partial)** — local-edit CMS PoC. Started with Sveltia, **pivoted to Decap CMS** (Sveltia doesn't support `local_backend`). End-to-end edit flow working from `poc/sveltia/` (admin) → `decap-server` (proxy) → PetGurashi `content/`. Production CMS choice still open. See `docs/poc/2026-05-06-cms-local-edit-poc.md`.

**Not started:** M3 (`blog-site-template` repo), M4 (hub MVP), M6 (editor onboarding).

**Article writing task #25 (PetGurashi 3-article guide-style addition)** is paused, tracked separately from this repo.

## Canonical docs (read these before changing things)

- **`docs/superpowers/specs/2026-05-06-platform-architecture-design.md`** — current architecture. Section 11 records execution deltas vs the original plan (read it; it overrides several "as-designed" details).
- `docs/superpowers/plans/2026-05-06-platform-monorepo-and-base-extraction.md` — M1+M2 plan. Historical record. Don't follow for future M3/M4 work; write fresh plans.
- `docs/poc/2026-05-06-cms-local-edit-poc.md` — Decap PoC findings + open CMS questions.
- `docs/superpowers/specs/2026-05-06-init-design.md` — superseded by the architecture spec; kept for context only.

## Repository layout

```
blog-hub/                              ← THIS repo (will be renamed to blog-platform on GitHub eventually)
├── packages/blog-base/                ← Nuxt Layer: engine + primitives + slot-shell + zod kernel
├── poc/sveltia/                       ← Decap CMS admin (despite the dir name) — local-edit PoC
└── docs/{superpowers,poc}/            ← specs / plans / PoC findings
```

PetGurashi lives at `/Users/yusaku/projects/PetGurashi/` (separate repo). Site work happens there. Platform work happens here.

## Architecture in one paragraph

`blog-base` is a Nuxt 3 Layer that ships the engine (modules, image/font defaults, content kernel, JSON-LD, MDC components, slot-only default layout, generic `[...slug].vue`). Sites (PetGurashi today) extend it via `extends: ['github:Yusaku0923/blog-hub/packages/blog-base#<sha>']` and contribute only the things that vary between sites: `app.config.ts` vocabulary (categoryLabels / navItems / masthead), CSS variable values for the theme, Header / Footer / Mobile components, the TOP page, and `content/`. Schema is the zod kernel from base, **inlined-duplicated** in each site's `content.config.ts` (see §11 of the architecture spec for why named imports don't work there).

## Hard-won lessons from M1+M2 (don't re-discover these)

1. **`content.config.ts` and `tailwind.config.ts` load before Nuxt aliases / giget cache exist.** Cross-layer imports (`@blog-platform/blog-base/...`, `#blog-base/...`, relative `../blog-hub/...`) all fail at this point. The kernel and Tailwind preset are therefore distributed differently:
   - Schema kernel: intentionally duplicated in each site's `content.config.ts`, with a `// keep in sync` comment. Drift risk is low because the kernel rarely changes.
   - Tailwind preset + content paths: shipped via the `@nuxtjs/tailwindcss` module's `config:` option in `packages/blog-base/nuxt.config.ts`. Sites only need their own content paths in their `tailwind.config.ts`.
2. **Layer's `nuxt.config.ts` must use absolute paths** for `components`, `css`, etc. — `~/` rebases to the consumer's CWD and breaks layer-owned assets. Use `resolve(layerDir, ...)` from `import.meta.url`.
3. **`useSiteConfig` is named `useBlogSite`** in the layer — `useSiteConfig` collided with another auto-import (likely from a Nuxt module).
4. **Bumping the base layer in PetGurashi**: push `main` here → copy SHA → update the `#<sha>` segment in `PetGurashi/nuxt.config.ts:2`. No Renovate yet (defer until 2nd site exists).

## Out of scope — do not propose

- LicenseHub integration (form differs; intentionally excluded)
- KW-research / image-acquisition automation in the hub (lives in Claude Code on the user's machine)
- Custom editor UI in the hub (CMS handles it)
- Multi-language, role granularity beyond admin/editor
- npm publishing of `blog-base` (git URL extends is intentional for now)

## Workflow

Spec → plan → implementation per milestone. Specs go under `docs/superpowers/specs/YYYY-MM-DD-<slug>.md`, plans under `docs/superpowers/plans/`. Use `superpowers:brainstorming` for spec, `superpowers:writing-plans` for plan, `superpowers:subagent-driven-development` for execution.

## Languages

User-facing copy and design docs are Japanese; code/identifiers are English. Match the surrounding language when adding to existing files.

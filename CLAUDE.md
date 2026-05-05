# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Init / pre-PoC.** No application code, build system, or tests exist yet. The repo currently contains only design documentation. Before making any concrete technical proposal, read the spec — it pins down decisions that are easy to accidentally re-litigate:

- `docs/superpowers/specs/2026-05-06-init-design.md` — the canonical design doc (background, scope, architecture choice, open questions, milestones)
- `README.md` — short summary in Japanese

## What this project is

`blog-hub` is a **management hub** for multiple Nuxt 3 + `@nuxt/content` v3 + Cloudflare Pages blogs (PetGurashi, LicenseHub, future siblings). Goals:

1. Let **non-engineers** edit and publish articles without touching CLI / Claude Code
2. Provide **cross-site analytics** (GA4 + GSC) in one dashboard
3. Make **adding a new blog** cheap

The hub edits other repos via GitHub API; it does not host the blog content itself. Each target blog continues to auto-deploy on push via its existing Cloudflare Pages pipeline.

## Architecture (chosen direction)

Three layers, see spec §5–§6:

```
Analytics dashboard   ← self-built thin wrapper around GA4 / Search Console APIs
Editing layer         ← off-the-shelf multi-repo CMS (Pages CMS / Sveltia / Keystatic / TinaCMS — TBD by PoC)
                        ↕ GitHub API
Target blog repos     ← PetGurashi, LicenseHub, … (content/ is the edit target)
```

Key conscious decisions baked into this direction:

- **Do not build a custom editor.** Adopt an existing CMS. Custom code is limited to the analytics dashboard.
- **Out of scope (stays in Claude Code, not the hub):** keyword-research scripts, image-acquisition pipelines, any automation. Don't propose adding these here.
- **Auth is GitHub OAuth** (standard for Git-based CMSes). Editors must have a GitHub account — known onboarding cost, accepted.
- **Hosting target is Cloudflare Pages**, same as the blogs. Evaluate options against this constraint.

## Open questions — do not pre-decide

The spec (§7) deliberately leaves these for the PoC. If a task touches them, surface the decision rather than picking silently:

- **A. CMS selection** (Pages CMS / Sveltia / Keystatic / TinaCMS) — gated on M2 PoC
- **B. Schema duality** between `@nuxt/content` zod config and the CMS's own schema — three resolution paths listed; not chosen
- **C. Site-registration mechanism** (how a new target blog gets onboarded) — undesigned

## Workflow

The spec says the cycle for each milestone (M1–M6) is **spec → plan → implementation**. Use the `superpowers:writing-plans` and `superpowers:writing-skills` style: produce a written plan before code. New design docs go under `docs/superpowers/specs/` with the `YYYY-MM-DD-<slug>.md` naming pattern.

## Languages

Spec and README are in Japanese. Match the language of existing docs when adding to them; code/identifiers are English.

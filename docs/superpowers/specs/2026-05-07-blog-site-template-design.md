# `blog-site-template` Design Spec

- **作成日**: 2026-05-07
- **ステータス**: ブレスト確定（実装プラン作成前）
- **対象**: Architecture Spec §3.4 で骨子だけ示されていた `blog-site-template` リポを実装可能レベルまで詰める
- **前提**: `2026-05-06-platform-architecture-design.md`（特に §11 execution deltas）+ `2026-05-06-cms-local-edit-poc.md`（Decap PoC findings）を読了していること

## 0. 目的

新サイトを `gh repo create my-new-blog --template Yusaku0923/blog-site-template` の **1コマンドで起こせる** 状態を作る。clone 直後に `pnpm install && pnpm dev` で動く placeholder サイトが立ち上がり、**プレースホルダーを埋めるだけで** production-ready な affiliate 系ブログとして機能することを目標とする。

「忘れがちな部分」（OGP / robots / sitemap / 静的ページ / prerender routes / Decap CMS 設定 / affiliate 系の法的雛形）はテンプレが**必須要件として同梱**する。design / category / brand 等の「サイトごとに変わる」ものは placeholder + `TEMPLATE:` マーカーで明示。

## 1. 採用方針サマリ

| 決定ポイント | 採用 | 理由 |
|------------|------|------|
| 出来上がりの完成度 | **B: 機能する placeholder サイト** | A（最小スケルトン）は立ち上げ作業が多すぎ、C（PetGurashi 派生）は design/tag 自由度の方針に逆行 |
| 配布方式 | **A: GitHub `--template` repo** | 公式パターン、追加学習コストなし。scaffolding script は YAGNI |
| Decap CMS 設定の同梱 | **A: 同梱する** | Decap PoC が動作確認済、Sveltia と config.yml 互換、batteries-included 哲学と整合 |
| 静的ページの中身 | **A: affiliate 系標準文言** | プラットフォーム自体が affiliate 系メディア前提（MDC affiliate デフォルト）、disclaimer は legal 必須 |
| Hero コンポーネントの位置 | **(b) テンプレ site-local** | M2「site-specific は site」の決定と整合、編集場所が明示的 |
| `category` の zod 型 | **`z.string()` + TEMPLATE コメント** | placeholder のうちは自由文字列、確定後 `z.enum([...])` に格上げ |
| サンプル記事の数 | **3本**（welcome / first-post / sample-review） | `<LatestArticleGrid>` が空にならず、各 MDC 利用例も提示 |

## 2. リポジトリ配置とトポロジ

```
github.com/Yusaku0923/blog-site-template      ← GitHub "Template repository" 設定 ON
└── (1リポ。新サイトは gh repo create --template Yusaku0923/blog-site-template)
```

**配置上の決定**:

1. **monorepo (`blog-hub`) には含めず独立リポ** — GitHub `--template` 機能は repo 単位でしか動かないため
2. **命名: `blog-site-template`**（単数形）— 「これはテンプレである」が一目瞭然
3. **テンプレリポの main ブランチが常に "ready to clone" 状態** — CI で enforce（§7）
4. **テンプレ自身は `extends: 'github:Yusaku0923/blog-hub/packages/blog-base#<実SHA>'`** を実 SHA で pin — テンプレの CI / dev / build が決定的に動くため。新サイトは clone 後そのまま使える、bump は任意

## 3. ファイル構成

```
blog-site-template/
├── nuxt.config.ts                       ← extends に実 SHA pin、site の最小値 placeholder
├── app.config.ts                        ← categoryLabels / navItems / masthead を雛形値で宣言
├── app.vue                              ← layout slot を埋める
├── content.config.ts                    ← baseSchema を inline 重複 + category: z.string() + TEMPLATE コメント
├── tailwind.config.ts                   ← 自プロジェクト content paths のみ（preset import なし）
├── assets/css/main.css                  ← CSS 変数の neutral 値
├── components/
│   ├── layout/
│   │   ├── SiteHeader.vue               ← placeholder（SITE_NAME / nav リテラル + TEMPLATE コメント）
│   │   └── SiteFooter.vue               ← placeholder（©<SITE_NAME> + 必須リンク）
│   ├── mobile/
│   │   ├── BottomNav.vue                ← navItems を読む最小実装
│   │   └── MobileMenu.vue               ← navItems を読む最小実装
│   └── home/
│       └── Hero.vue                     ← placeholder（TOP のヒーローセクション）
├── pages/
│   ├── index.vue                        ← <Hero /> + <LatestArticleGrid> + <TagCloud>
│   ├── about.vue                        ← placeholder（サイト紹介）
│   ├── privacy.vue                      ← affiliate 系標準文言
│   └── disclaimer.vue                   ← affiliate 系標準文言
├── content/
│   └── example/
│       ├── index.md                     ← pageType: category, "Sample Category"
│       ├── welcome.md                   ← 純テキスト、frontmatter 全フィールド例
│       ├── first-post.md                ← ::faq-section MDC 例
│       └── sample-review.md             ← ::product-card MDC 例（affiliate）
├── public/
│   ├── _redirects                       ← trailing slash 正規化
│   ├── og-default.png                   ← placeholder OGP（neutral）
│   ├── og/                              ← .gitkeep のみ
│   ├── images/                          ← .gitkeep のみ
│   └── admin/                           ← Decap CMS admin（CF Pages の /admin/ で配信）
│       ├── index.html                   ← <script src="https://unpkg.com/decap-cms@^3/dist/decap-cms.js">
│       └── config.yml                   ← collections（content/example マップ）+ local_backend
├── tsconfig.json                        ← extends ./.nuxt/tsconfig.json
├── package.json                         ← scripts: dev/build/preview/typecheck + cms:proxy + template:check
├── pnpm-lock.yaml                       ← 初期 lockfile（CI 安定化）
├── .nvmrc                               ← 20
├── .gitignore                           ← node_modules / .nuxt / dist / .env 等
├── .is-template                         ← sentinel ファイル（§7.2 参照、新サイト派生時に削除）
├── .github/workflows/ci.yml             ← typecheck + build + (sentinel が無ければ) template:check
├── README.md                            ← 日本語、新サイトオーナー向け（§6.2）
└── CLAUDE.md                            ← 英語、Claude Code 向けガイド（§6.3）
```

## 4. 主要 config / theme ファイルの具体的中身

### 4.1 `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  extends: ['github:Yusaku0923/blog-hub/packages/blog-base#<REAL_SHA_AT_TEMPLATE_RELEASE>'],
  compatibilityDate: '2026-05-07',

  // TEMPLATE: replace site.url / siteUrl with your domain after Cloudflare Pages setup.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com',
    name: 'Your Site Name',
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com',
    },
  },

  // TEMPLATE: replace with the fonts you actually want. Defaults are system fonts
  // (no Google network fetch) so the template builds offline.
  fonts: {
    families: [],
  },

  app: {
    head: { htmlAttrs: { lang: 'ja' } },
  },

  robots: {
    allow: ['/'],
    disallow: ['/og/'],
  },
  sitemap: {
    exclude: ['/og/**'],
  },

  nitro: {
    preset: 'cloudflare-pages-static',
    prerender: {
      failOnError: false,
      crawlLinks: true,
      // TEMPLATE: add category index routes here when categories are defined.
      routes: ['/', '/about', '/privacy', '/disclaimer', '/example'],
    },
  },
})
```

§11-G に従って `modules` / `components` 宣言は省略（base が提供）。§11-H 教訓を踏まえ prerender routes に static pages を明示。

### 4.2 `app.config.ts`

```ts
export default defineAppConfig({
  site: {
    categoryLabels: {
      general: 'General',
      // TEMPLATE: add entries for each category in your content.config.ts enum
    },
    navItems: [
      { label: 'HOME',  to: '/' },
      { label: 'ABOUT', to: '/about' },
      // TEMPLATE: add category nav items
    ],
    masthead: {
      tagline:  '— A NEW BLOG —',
      subtitle: 'Your site subtitle here',
      // volumeBanner / volumeStartYear are intentionally omitted from the
      // template — those are PetGurashi's magazine-style aesthetic.
    },
  },
})
```

### 4.3 `content.config.ts`

```ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// NOTE: schema kernel duplication.
// blog-base ships a canonical baseSchema at packages/blog-base/content/schema.ts.
// content.config.ts is loaded by c12 before Nuxt aliases / module resolution
// activate, so importing the kernel from the layer fails. Inlining keeps this
// file static-importable. Drift risk is small — kernel rarely changes.
// Keep in sync with: packages/blog-base/content/schema.ts
export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
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
        // TEMPLATE: replace with z.enum([...]) once your categories are defined.
        category:    z.string(),
      }),
    }),
  },
})
```

### 4.4 `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'

// The base layer's preset (CSS-variable-backed colors + fontFamily) and
// the layer's own content paths are merged in via blog-base/nuxt.config.ts's
// tailwindcss.config option. Importing them here would break in CI —
// tailwind.config.ts is loaded before Nuxt aliases / giget cache exist.
export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './content/**/*.md',
  ],
}
```

### 4.5 `assets/css/main.css`

neutral palette。「placeholder と一目で分かる」ことより「立ち上げ直後に醜くない」を優先。

```css
/*
 * TEMPLATE: customize these values for your brand.
 * Variable NAMES are owned by blog-base; values are owned here.
 */
:root {
  --color-bg:      #FFFFFF;
  --color-paper:   #FAFAFA;
  --color-ink:     #1A1A1A;
  --color-muted:   #666666;
  --color-line:    #E5E5E5;
  --color-tag:     #F0F0F0;
  --color-accent:  #2563EB;
  --color-accent2: #6B7280;

  --font-display: ui-serif, Georgia, "Times New Roman", serif;
  --font-body:    ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", Menlo, monospace;
}
```

### 4.6 `app.vue`

```vue
<template>
  <NuxtLayout>
    <template #header><SiteHeader /></template>
    <template #footer><SiteFooter /></template>
    <template #mobile>
      <BottomNav />
      <MobileMenu />
    </template>
    <NuxtPage />
  </NuxtLayout>
</template>
```

## 5. プレースホルダー設計

### 5.1 マーキング規約

`TEMPLATE:` リテラル prefix を全テンプレ的記述に付ける。

| ファイル種別 | 形式 |
|------|------|
| `.ts` / `.js` / `.vue <script>` | `// TEMPLATE: <instruction>` |
| `.vue <template>` / `.html` / `.md` body | `<!-- TEMPLATE: <instruction> -->` |
| `.css` | `/* TEMPLATE: <instruction> */` |
| `.yml` / `.yaml` | `# TEMPLATE: <instruction>` |

検出: `pnpm template:check`（`grep -rn 'TEMPLATE:'` を内部実行、README/CLAUDE.md は除外）。

**TemplateBanner UI コンポーネントは同梱しない** — 消し忘れて prod に残るリスクが grep の手軽さに見合わない。

### 5.2 `components/home/Hero.vue`（placeholder）

サイト名はリテラルで持つ（テンプレ立ち上げ時に `Your Site Name` を find-and-replace で書き換える前提）。runtime config を経由しないことで「TEMPLATE マーカーで grep ヒットする箇所」を明示。

```vue
<template>
  <!-- TEMPLATE: replace this entire hero block with your site's identity. -->
  <section class="text-center px-10 pt-16 pb-12 border-b border-line">
    <div class="text-[11px] tracking-[3px] text-muted mb-3">— WELCOME —</div>
    <h1 class="font-display text-[56px] leading-[1.1] tracking-[-1px] text-ink mb-5">
      <!-- TEMPLATE: replace 'Your Site Name' with your site name -->
      Your Site Name
    </h1>
    <p class="text-[14px] text-muted max-w-[540px] mx-auto leading-[1.7]">
      {{ masthead.subtitle }}
    </p>
  </section>
</template>

<script setup lang="ts">
const blogSite = useBlogSite()
const masthead = computed(() => blogSite.masthead ?? {})
</script>
```

### 5.3 `components/layout/SiteHeader.vue`（placeholder）

```vue
<template>
  <header class="border-b border-line">
    <div class="flex items-center justify-between px-10 py-5">
      <NuxtLink to="/" class="font-display text-[24px] tracking-[-0.5px] text-ink">
        <!-- TEMPLATE: replace 'Your Site Name' with your site logo or wordmark -->
        Your Site Name
      </NuxtLink>
      <div class="text-[11px] tracking-[2px] text-muted">{{ masthead.tagline }}</div>
    </div>
    <nav class="flex justify-center gap-8 border-t border-line py-3 text-[13px] tracking-[1px]">
      <NuxtLink
        v-for="item in nav"
        :key="item.label"
        :to="item.to"
        class="text-ink hover:text-accent"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
const blogSite = useBlogSite()
const masthead = computed(() => blogSite.masthead ?? {})
const nav = computed(() => blogSite.navItems ?? [])
</script>
```

### 5.4 `components/layout/SiteFooter.vue`（placeholder）

```vue
<template>
  <footer class="border-t border-line px-10 py-8 text-center text-[11px] text-muted">
    <div class="mb-3">
      <NuxtLink to="/about" class="mx-3 hover:text-ink">ABOUT</NuxtLink>
      <NuxtLink to="/privacy" class="mx-3 hover:text-ink">PRIVACY</NuxtLink>
      <NuxtLink to="/disclaimer" class="mx-3 hover:text-ink">DISCLAIMER</NuxtLink>
    </div>
    <!-- TEMPLATE: update copyright once you decide on entity / year -->
    <div>© {{ new Date().getFullYear() }} Your Site Name. All rights reserved.</div>
  </footer>
</template>
```

### 5.5 サンプル記事

#### `content/example/index.md`

```md
---
title: "Sample Category"
description: "テンプレートに同梱されているサンプル記事のカテゴリです。新サイト立ち上げ後、このディレクトリは削除して自分のカテゴリ構成に置き換えてください。"
category: general
date: 2026-05-07
created: 2026-05-07
pageType: category
listed: false
---
```

#### `content/example/welcome.md`（純テキスト、最小例）

```md
---
# TEMPLATE: edit or delete this article when you start writing your own.
title: "ようこそ — 最初の記事です"
description: "テンプレートから派生したサイトで、最初に表示されるサンプル記事です。frontmatter のフィールドと記事本文の最小例を示します。"
category: general
tags: [welcome, getting-started]
date: 2026-05-07
created: 2026-05-07
---

このサイトは [blog-platform](https://github.com/Yusaku0923/blog-hub) の `blog-site-template` から立ち上げられました。

## はじめに

`content/` 配下に Markdown ファイルを置けば記事として公開されます。
`content.config.ts` の zod スキーマで frontmatter が validate されるので、必須フィールドを埋めてください。

## 次にすること

1. `pnpm template:check` でテンプレ箇所を洗い出して埋める
2. `app.config.ts` のカテゴリ・ナビを自分の構成に
3. `assets/css/main.css` のカラーを自分のブランドに
4. この `content/example/` ディレクトリを消して自分の記事を書き始める
```

#### `content/example/first-post.md`（FAQ MDC 例）

```md
---
title: "FAQ コンポーネントの使い方"
description: "::faq-section MDC コンポーネントを使うと、本文に Q&A 形式のセクションを構造化データ付き（FAQPage JSON-LD）で挿入できます。"
category: general
tags: [mdc, faq, getting-started]
date: 2026-05-07
created: 2026-05-07
---

::faq-section
---
items:
  - q: 「TEMPLATE:」コメントは何のためにありますか？
    a: 新サイト立ち上げ時に置換が必要な箇所のマーカーです。`pnpm template:check` で全箇所を洗い出せます。
  - q: blog-base layer のバージョンを上げるには？
    a: nuxt.config.ts の `extends` の SHA を最新に書き換えます。Yusaku0923/blog-hub の commits ページから取得してください。
  - q: 独自の MDC コンポーネントを追加できますか？
    a: 可能です。`components/content/` にコンポーネントを置けば自動で MDC 構文 `::your-component` で呼べます。
---
::

このセクションは Schema.org の FAQPage JSON-LD として SEO 検索結果にリッチスニペット表示される可能性があります。
```

#### `content/example/sample-review.md`（Product MDC 例）

```md
---
title: "商品レビューのテンプレート"
description: "::product-card で構造化データ（Product + AggregateRating）付きのレビューを書く例です。テンプレ削除時にカテゴリ全体ごと外してください。"
category: general
tags: [mdc, product, review, sample]
date: 2026-05-07
created: 2026-05-07
---

<!-- TEMPLATE: this is an affiliate-style sample. Remove or adapt for your monetization model. -->

::product-card
---
name: サンプル商品
price: ¥0
rating: 5
reviews: 0
amazonUrl: https://example.com/
rakutenUrl: https://example.com/
description: 実在しないダミー商品です。
---
::

`::product-card` は Product / AggregateRating の JSON-LD を自動生成します。`amazonUrl` / `rakutenUrl` のリンクには `rel="sponsored nofollow noopener"` が自動付与されます。
```

### 5.6 `public/admin/config.yml`（Decap CMS）

PoC findings の `config.yml` を雛形化したもの。collections は `content/example` の3記事を1コレクションにマップ。

```yaml
# TEMPLATE: replace 'YOUR_GH_USER/YOUR_REPO' with your actual GitHub repo before Cloudflare Pages deploy
backend:
  name: github
  repo: YOUR_GH_USER/YOUR_REPO
  branch: main

# Local development: decap-server proxy at localhost:8082 (see README §6)
local_backend:
  url: http://localhost:8082/api/v1
  allowed_hosts:
    - http://localhost:8080

media_folder: public/images/articles
public_folder: /images/articles

# TEMPLATE: rename / restructure these collections to match your content/ layout
collections:
  - name: example
    label: Example category
    folder: content/example
    create: true
    extension: md
    format: yaml-frontmatter
    slug: '{{slug}}'
    fields:
      - { label: Title,        name: title,       widget: string }
      - { label: Description,  name: description, widget: text }
      - { label: Category,     name: category,    widget: string, default: general }
      - { label: Tags,         name: tags,        widget: list, default: [] }
      - { label: Date,         name: date,        widget: datetime }
      - { label: Created,      name: created,     widget: datetime }
      - { label: Listed,       name: listed,      widget: boolean, default: true }
      - { label: ToC,          name: toc,         widget: boolean, default: true }
      - { label: Draft,        name: draft,       widget: boolean, default: false }
      - { label: PageType,     name: pageType,    widget: select, options: ['article', 'category'], default: article }
      - { label: HeroImage,    name: heroImage,   widget: image, required: false }
      - { label: Body,         name: body,        widget: markdown }
```

注:
- collection は1つだけ同梱（`example`）。新サイトは confirmed カテゴリ別に collection を切る
- `field` 定義は `content.config.ts` の zod スキーマと**手動同期**（spec §11-A の duality と同根の問題）
- `media_folder` は `public/images/articles/` に固定（articles 用）。OGP は `public/og/` で別管理（CMS では触らない）

### 5.7 静的ページ（about / privacy / disclaimer）

#### `pages/about.vue`

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'About',
  description: 'TEMPLATE: replace with your site description for SEO',
})
</script>

<template>
  <article class="max-w-[720px] mx-auto px-6 pt-14 pb-20">
    <h1 class="font-display text-[42px] leading-[1.25] text-center mb-8">About</h1>
    <!-- TEMPLATE: write about your site, your team, your purpose. -->
    <p class="text-[16px] leading-[1.95] mb-6">
      このページにサイトの目的・運営者・コンタクト情報を記載してください。
    </p>
    <p class="text-[16px] leading-[1.95]">
      TEMPLATE: replace this paragraph.
    </p>
  </article>
</template>
```

#### `pages/disclaimer.vue`

```vue
<script setup lang="ts">
useSeoMeta({
  title: '免責事項・アフィリエイト開示',
  description: '当サイトのアフィリエイトプログラム参加状況および免責事項。',
})
</script>

<template>
  <article class="max-w-[720px] mx-auto px-6 pt-14 pb-20 prose prose-lg">
    <!-- TEMPLATE: review the affiliate disclosures below and adapt to programs you actually participate in. -->
    <h1>免責事項・アフィリエイト開示</h1>

    <h2>アフィリエイトプログラムへの参加</h2>
    <p>
      当サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。
    </p>
    <p>
      当サイトは、楽天アフィリエイトプログラムにも参加しており、楽天市場の商品を紹介し、リンク経由で商品が購入された場合に紹介料を得る場合があります。
    </p>

    <h2>記事内容について</h2>
    <p>
      当サイトの掲載情報は記事執筆時点のものであり、最新性・正確性を保証するものではありません。商品の価格・仕様・在庫状況は変動するため、購入前に各販売サイトで必ず確認してください。
    </p>

    <h2>免責</h2>
    <p>
      当サイトの情報を利用したことによって生じた損害について、運営者は一切の責任を負いません。
    </p>
  </article>
</template>
```

#### `pages/privacy.vue`

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'プライバシーポリシー',
  description: '当サイトにおける個人情報の取扱いについて。',
})
</script>

<template>
  <article class="max-w-[720px] mx-auto px-6 pt-14 pb-20 prose prose-lg">
    <!-- TEMPLATE: review and adapt for jurisdiction, analytics tools used, and contact channels. -->
    <h1>プライバシーポリシー</h1>

    <h2>個人情報の取得・利用</h2>
    <p>
      当サイトは、お問い合わせフォーム等で取得した個人情報をお問い合わせ対応以外の目的に使用しません。
    </p>

    <h2>Cookie・アクセス解析ツール</h2>
    <p>
      当サイトは Google Analytics（または同等のアクセス解析ツール）を利用しており、Cookie によりアクセス情報を匿名で取得しています。Cookie の利用を望まない場合はブラウザ設定で無効化できます。
    </p>

    <h2>アフィリエイトプログラム</h2>
    <p>
      当サイトはアフィリエイトプログラムを利用しています。詳細は <NuxtLink to="/disclaimer">免責事項</NuxtLink> をご参照ください。
    </p>

    <h2>お問い合わせ</h2>
    <!-- TEMPLATE: replace with your actual contact email or form -->
    <p>個人情報の取扱いについてのお問い合わせ先: contact@example.com</p>
  </article>
</template>
```

## 6. README + scripts + CLAUDE.md

### 6.1 `package.json` の scripts

```json
{
  "name": "blog-site-template",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "nuxt dev --port 8080",
    "build": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck",
    "cms:proxy": "PORT=${DECAP_PORT:-8082} ALLOWED_HOSTS=${DECAP_ALLOWED_HOSTS:-http://localhost:8080} npx -y decap-server",
    "template:check": "grep -rn 'TEMPLATE:' . --exclude-dir=node_modules --exclude-dir=.nuxt --exclude-dir=dist --exclude-dir=.git --exclude=README.md --exclude=CLAUDE.md || echo 'No TEMPLATE markers found — ready to ship.'"
  },
  "devDependencies": {
    "@nuxt/fonts": "^0.14.0",
    "@nuxt/image": "^2.0.0",
    "@nuxtjs/robots": "^6.0.7",
    "@nuxtjs/sitemap": "^8.0.13",
    "@nuxtjs/tailwindcss": "^6.14.0",
    "@types/node": "^25.6.0",
    "nuxt": "^3.14.0",
    "tailwindcss": "^3",
    "typescript": "^5.6.0"
  },
  "dependencies": {
    "@nuxt/content": "^3.13.0",
    "@nuxtjs/mdc": "^0.21.1"
  }
}
```

ポイント:
- `cms:proxy` は `DECAP_PORT` / `DECAP_ALLOWED_HOSTS` で override 可能。デフォルト 8082（PoC findings の Docker Desktop 衝突回避）
- `template:check` はマーカー検出。`pnpm template:check` で **"No TEMPLATE markers found"** が出れば本番デプロイ準備完了

### 6.2 `README.md`（日本語、新サイトオーナー向け）

主要セクション:

1. **概要** — テンプレが何であり、何を生成するか
2. **クイックスタート** — `gh repo create --template` から `pnpm dev` まで
3. **テンプレ箇所の置換** — `pnpm template:check` + 主要ファイルの編集ポイント一覧
4. **blog-base SHA bump 手順** — `git ls-remote https://github.com/Yusaku0923/blog-hub HEAD` から `nuxt.config.ts:2` 更新まで
5. **Cloudflare Pages デプロイ** — Build command / Output dir / 環境変数
6. **CMS（Decap）でローカル編集** — `pnpm cms:proxy` + `pnpm dev` の2ターミナル運用、port override 手順
7. **collections 拡張時の手順** — `public/admin/config.yml` と `content.config.ts` の二重管理についての注意
8. **blog-base layer のアップデート受け取り方**
9. **ディレクトリ構成早見表** — 何が site 持ち / base 持ちか
10. **トラブルシューティング表** — `pnpm install` 失敗 / Decap config エラー / port 衝突 / MDC rich-text 崩壊 / CF Pages build エラーの対処
11. **参考ドキュメント** — blog-hub README / architecture spec §11 / PoC findings へのリンク
12. **開発時の注意** — テンプレ自身の main は CI で `pnpm install && pnpm dev` の安定動作を保つ

（具体的な README 本文は brainstorm セクション 5 に記載済、実装プランで生成する）

### 6.3 `CLAUDE.md`（英語、Claude Code 向け）

主要セクション:

1. **Project relation** — このサイトが `blog-base` Nuxt Layer を extend していること、コードの大半は layer 側にある旨
2. **Commands** — `pnpm dev` / `build` / `typecheck` / `cms:proxy` / `template:check`
3. **What lives here vs in the layer** — site 持ち / base 持ちの責務早見表
4. **Hard-won lessons inherited from blog-base** —
   - content.config.ts cannot import from layer (§11-A)
   - tailwind.config.ts cannot import preset (§11-B)
   - composable name is `useBlogSite()` not `useSiteConfig()` (§11-D)
   - Layer updates are manual (no Renovate)
5. **Out of scope** — base 側の修正はしない、CMS 切替はここの設定変更
6. **Languages** — JP for user-facing copy, EN for code

（具体的な CLAUDE.md 本文は brainstorm セクション 5 に記載済）

## 7. CI / 検証 / メンテナンス

### 7.1 CI workflow

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm build
      - name: Check for unreplaced TEMPLATE markers
        if: ${{ !hashFiles('.is-template') }}
        run: pnpm template:check | tee /dev/stderr | grep -q 'No TEMPLATE markers found'
```

### 7.2 `.is-template` sentinel ファイル

テンプレ main には**空の `.is-template`** を含める。

- 存在する間: CI は `template:check` をスキップ → テンプレ main は TEMPLATE マーカー保持で CI green
- 新サイト派生時の手順:
  ```bash
  pnpm template:check          # No TEMPLATE markers found を確認
  rm .is-template              # CI の readiness check を有効化
  git add -A && git commit -m "chore: complete template setup"
  ```
- 効果: 派生サイトが TEMPLATE マーカーを残したまま production にマージするのを CI が阻止

### 7.3 テンプレ自身の保守トリガ

| トリガ | 対応 | 頻度 |
|--------|------|------|
| `blog-base` の `baseSchema` フィールド追加/変更 | テンプレ `content.config.ts` の inline kernel を同期、README §3 の bump 手順に反映 | base 変更時 |
| `blog-base` の composable / component API 変更 | テンプレの該当呼び出しを更新 | base 変更時 |
| Decap CMS のメジャーバージョン更新 | `public/admin/index.html` の `<script src>` の `^3` を新バージョンに | 年1回程度 |
| Nuxt / Tailwind のメジャーバージョン更新 | テンプレと base の両方で互換確認後、`package.json` 依存を bump | 半年〜1年 |
| 新しい運用ノウハウ（PoC で見つかった罠等） | README または CLAUDE.md に追記 | アドホック |

→ 「テンプレを更新したら派生済みサイトに自動反映されない」のは仕様。派生サイトは自己責任で SHA bump / テンプレ差分の手動取り込みを行う（Renovate 自動化は YAGNI、3サイト超えてから検討）。

### 7.4 バージョニング

**当面なし**。git tag も切らない。理由:

1. `gh repo create --template` は派生時の origin version を追跡しない
2. 派生サイトはテンプレから独立して進化する想定
3. tag 運用のコスト > 得られる価値

将来必要になる兆候（テンプレに breaking change 頻発）が出たら `template-v1.0.0` 等の tag 運用を導入。

## 8. 確定事項まとめ + 非ゴール

### 確定事項（再 litigate 防止）

- 配布: GitHub `--template` repo（`Yusaku0923/blog-site-template`）
- 完成度: 機能する placeholder サイト（Q1-B）
- CMS 同梱: Decap admin + config.yml（Q3-A、`public/admin/`）
- 静的ページ: affiliate 系雛形あり（Q4-A）
- Hero: テンプレ site-local（Q5-b）
- category: `z.string()` placeholder
- サンプル記事: 3本（welcome / first-post / sample-review）
- TemplateBanner UI: 採用しない、grep ベースで運用
- Renovate / 自動更新: 入れない
- バージョニング: tag なし

### 非ゴール

- 多言語対応（日本語想定の placeholder のみ）
- non-affiliate サイト向けの専用テンプレ分離（必要になったら別 template repo を派生）
- TinaCMS / Keystatic 同梱（M5 で別 CMS が選定されたら差し替え）
- 自動 Renovate / Dependabot
- テンプレからの差分自動同期メカニズム（派生サイトは独立進化）
- scaffolding スクリプト（`pnpm create blog-site` 形式）
- 派生サイト追跡（テンプレが派生先のリストを持つ等）

## 9. オープン課題（後続フェーズで決定）

| 課題 | 影響 | 解消フェーズ |
|------|------|------------|
| M5 final CMS choice | テンプレ `public/admin/` の差し替え発生可能性 | M5 完了時 |
| TinaCMS / Keystatic 比較 PoC | 上記 | M5 |
| 画像アップロード保管先（site repo `public/images/` vs CF R2） | テンプレ `public/admin/config.yml` の `media_folder` 設定方針 | M5 PoC で決定 |
| MDC コンポーネントの Decap カスタムウィジェット化 | rich-text モードで MDC が崩れる問題（PoC findings §4-A） | 別 PoC |
| マルチサイト Decap admin（同一 admin で複数サイト切替） | テンプレが対応するか別構造 | hub MVP（M4）と併走 |
| production OAuth flow（GitHub OAuth App 設定） | テンプレの `config.yml` に `backend.repo` 等の placeholder 追記 | hub MVP（M4）と併走 |

## 10. リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| テンプレの SHA pin が古びて不便 | 派生サイトが手動 bump せざるを得ない | README §3 で bump 手順を明示、3サイト超えで Renovate 検討 |
| TEMPLATE マーカーが prod に残る | placeholder text が公開される | sentinel ファイル + CI enforce（§7.2） |
| schema kernel drift（base と template の inline 重複が乖離） | content build エラー | `content.config.ts` のコメントで明示、CLAUDE.md で警告 |
| Decap CMS が将来 deprecated になる | `public/admin/` の差し替え | `config.yml` は Sveltia / 他 CMS と互換性ありなので最小コストで切替可能 |
| `--template` 派生時に `.github/workflows/` がコピーされ CI が `pnpm template:check` を fail させる | 新サイトの初期 PR が即 fail | `.is-template` sentinel で skip → 派生時に削除 |
| OG 画像 placeholder が差し替え忘れで prod に出る | branding 問題、SEO 影響 | TEMPLATE コメント + README チェックリストで明示 |

---

**次のステップ**: ユーザレビュー → 承認後 commit → writing-plans skill で `blog-site-template` リポ生成の実装プランを作成。
